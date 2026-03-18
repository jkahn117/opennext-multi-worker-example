# Architecture

## Overview

The application is split across 3 Cloudflare Workers connected via Service Bindings:

```
                        Internet
                           |
                           v
                  +------------------+
                  |    Middleware     |
                  | (plain Worker)   |
                  |                  |
                  | - Route by path  |
                  | - Serve assets   |
                  | - Version pins   |
                  +--------+---------+
                           |
              Service Bindings (internal, zero-cost)
                    |              |
                    v              v
            +------------+  +------------+
            | SSR Worker |  | SSG Worker |
            | (Next.js)  |  | (Next.js)  |
            |            |  |            |
            | /products  |  | /          |
            | /cart       |  | /blog      |
            | /checkout  |  | /about     |
            | /account   |  | /faq       |
            | /api/*     |  |            |
            +------------+  +------------+
```

## Request Flow

1. All requests hit the **middleware worker** (the primary worker in `wrangler dev -c`)
2. Middleware checks the URL path:
   - `/_next/*` -- served directly from the middleware's merged ASSETS binding
   - `/`, `/blog*`, `/about`, `/faq` -- forwarded to SSG worker via service binding
   - Everything else -- forwarded to SSR worker via service binding
3. Before forwarding, middleware injects `Cloudflare-Workers-Version-Overrides` header to pin the downstream worker to a specific version
4. The content worker processes the request (SSR render, API handler, or static page) and returns the response
5. Middleware adds CORS and routing headers, then returns to the client

## Workers

### Middleware (`apps/middleware`)

**Not a Next.js app.** A plain Cloudflare Worker built with esbuild that extends `WorkerEntrypoint`.

Responsibilities:
- Path-based routing to SSR and SSG workers
- Serving all static assets (`/_next/static/*`) from a merged directory
- Injecting version affinity headers for gradual deployments
- CORS headers

The middleware has no application logic. It's a stable routing layer that changes infrequently.

### SSR Worker (`apps/ssr-worker`)

A full Next.js 16 application built with the OpenNext Cloudflare adapter.

Contains:
- **API routes** (`/api/products`, `/api/cart`, `/api/checkout`, `/api/health`) -- these were originally a separate API worker but were merged here because server components can call them directly without an HTTP round-trip
- **Dynamic pages** (`/products/[slug]`, `/cart`, `/checkout`) -- server-rendered on each request
- **Static pages** (`/products`, `/account`) -- prerendered with revalidation
- **Data layer** (`src/lib/mock-data.ts`, `src/lib/cart-store.ts`) -- in-memory product catalog and cart store, shared between API routes and server components

### SSG Worker (`apps/ssg-worker`)

A full Next.js 16 application built with the OpenNext Cloudflare adapter.

Contains:
- **Static pages** (`/`, `/about`, `/faq`) -- fully static, prerendered at build time
- **ISR pages** (`/blog`, `/blog/[slug]`) -- static with incremental revalidation
- **Marketing components** (`Header`, `Footer`) -- different nav from the SSR worker

## Static Asset Serving

Each Next.js app generates its own static chunks with unique hashes. When the SSG worker serves `/`, the HTML references chunks like `turbopack-abc123.js`. When the SSR worker serves `/products`, it references different chunks.

**Problem:** Service binding requests bypass the Wrangler assets layer. If the middleware forwards a `/_next/static/chunks/abc.js` request to the SSR worker via service binding, the OpenNext worker code handles it (not the asset serving layer), and it crashes with a 500.

**Solution:** At build time, `scripts/merge-assets.sh` copies static assets from both workers into `apps/middleware/.assets/`. The middleware's `wrangler.jsonc` has an `assets.directory` pointing there. Wrangler's built-in asset serving handles these requests directly -- no service binding involved.

```
Build:
  apps/ssr-worker/.open-next/assets/ ──┐
                                       ├──> apps/middleware/.assets/
  apps/ssg-worker/.open-next/assets/ ──┘

Runtime:
  GET /_next/static/chunks/abc.js → middleware ASSETS binding → direct response
```

## Service Bindings

Workers communicate via [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), configured in `apps/middleware/wrangler.jsonc`:

```jsonc
"services": [
  { "binding": "SSR_WORKER", "service": "opennext-ssr" },
  { "binding": "SSG_WORKER", "service": "opennext-ssg" }
]
```

Service bindings are:
- **Zero-cost** -- no HTTP overhead, in-process call within the same Cloudflare colo
- **Type-safe** -- accessed as `env.SSR_WORKER.fetch(request)`
- **Version-aware** -- combined with the `Cloudflare-Workers-Version-Overrides` header, requests are pinned to specific worker versions

In local dev, `wrangler dev -c middleware.jsonc -c ssr.jsonc -c ssg.jsonc` automatically connects the service bindings between all workers in a single process.

## Version Affinity

During gradual deployments, multiple versions of a worker can be active simultaneously. To prevent version mismatches (e.g., new middleware + old SSR worker), the middleware pins every request to specific content worker versions.

The deploy script:
1. Uploads new SSR and SSG versions
2. Writes their version IDs into the middleware's `wrangler.jsonc` as env vars
3. Uploads the middleware, which now carries those IDs

At runtime, the middleware sets:
```
Cloudflare-Workers-Version-Overrides: opennext-ssr="<version-id>"
```

The header key must match the worker's **registered name** (from `wrangler.jsonc` `name` field), not the binding name.

## OpenNext Configuration

Both Next.js workers use `defineCloudflareConfig` from `@opennextjs/cloudflare`:

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: "dummy",
  queue: "direct",
});
```

The `node:crypto` compatibility issue (OpenNext imports it for cache key hashing, but Workers don't support it) is fixed via `pnpm patch` -- see `patches/@opennextjs__cloudflare@1.17.1.patch`.

## Shared Types

`packages/shared-types` provides TypeScript interfaces used across workers:

- `Product`, `ProductListResponse` -- product catalog types
- `Cart`, `CartItem` -- shopping cart types
- `ApiResponse<T>` -- standard API response wrapper
- `DeploymentState` -- deployment tracking types

This package is a build dependency -- it compiles to JS and is imported at build time by each worker.
