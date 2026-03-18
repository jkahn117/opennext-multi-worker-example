# OpenNext Multi-Worker

A sample eCommerce application demonstrating multi-worker architecture with [OpenNext](https://opennext.js.org/) and [Cloudflare Workers](https://developers.cloudflare.com/workers/).

Three independent Next.js workers communicate via Service Bindings, with a middleware worker routing requests and enforcing version affinity during gradual deployments.

## Architecture

```
Client Request
      |
      v
+---------------------+
| Middleware Worker    |  Port 8790 (dev)
| - Path-based routing|
| - Static assets     |
| - Version affinity  |
+-----+----------+----+
      |          |
 Service     Service
 Binding     Binding
      |          |
      v          v
+-----------+  +-----------+
| SSR Worker|  | SSG Worker|
| Port 8788 |  | Port 8789 |
| - /products| | - /       |
| - /cart    | | - /blog   |
| - /checkout| | - /about  |
| - /account | | - /faq    |
| - /api/*   | |           |
+-----------+  +-----------+
```

| Worker | Role | Tech |
|---|---|---|
| **Middleware** (`apps/middleware`) | Routes requests, serves merged static assets, injects version affinity headers | Plain Cloudflare Worker (esbuild) |
| **SSR** (`apps/ssr-worker`) | Dynamic pages + API routes | Next.js 16 + OpenNext Cloudflare adapter |
| **SSG** (`apps/ssg-worker`) | Static marketing pages with ISR | Next.js 16 + OpenNext Cloudflare adapter |

## Project Structure

```
opennext-multi-worker/
  apps/
    middleware/           # Routing worker (not Next.js)
      src/index.ts        # WorkerEntrypoint with routing logic
      wrangler.jsonc      # Service bindings to SSR + SSG
    ssr-worker/           # SSR + API worker
      src/app/            # Next.js App Router (products, cart, checkout, api/*)
      open-next.config.ts # defineCloudflareConfig
      wrangler.jsonc
    ssg-worker/           # SSG worker
      src/app/            # Next.js App Router (home, blog, about, faq)
      open-next.config.ts # defineCloudflareConfig
      wrangler.jsonc
  packages/
    shared-types/         # Product, Cart, API response types
  scripts/
    deploy.ts             # Gradual deployment orchestration
    merge-assets.sh       # Merges static assets for middleware
  patches/
    @opennextjs__cloudflare@1.17.1.patch  # Fixes node:crypto in Workers
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Wrangler 4.75+

## Quick Start

```bash
# Install dependencies (also applies the OpenNext crypto patch)
pnpm install

# Build and run all workers locally
pnpm run dev
```

This runs `turbo run build:cloudflare` (builds Next.js + OpenNext adapter for each worker), merges static assets, then starts a single Wrangler process with all 3 workers via `wrangler dev -c ... -c ...`.

Open http://localhost:8790 to see the app.

## Commands

| Command | Description |
|---|---|
| `pnpm run dev` | Build + run all workers locally |
| `pnpm run build` | Build Next.js apps + middleware |
| `pnpm run deploy:init` | First deploy (creates workers on Cloudflare) |
| `pnpm run deploy` | Gradual deploy with version affinity |
| `pnpm run deploy:dry-run` | Preview deploy without making changes |
| `pnpm run deploy:status` | Show active deployments for all workers |
| `pnpm run typecheck` | Run TypeScript type checking |
| `pnpm run clean` | Remove all build artifacts and node_modules |

## Documentation

- [Architecture](./docs/architecture.md) - How the multi-worker routing and static assets work
- [Development](./docs/development.md) - Local dev workflow and project conventions
- [Deployment](./docs/deployment.md) - Gradual deployment with version affinity
- [Design Decisions](./docs/design-decisions.md) - Why we made the choices we did

## Key Design Decisions

**Why 3 workers instead of 1?** Independent scaling and deployment. SSG pages change rarely and can be cached aggressively. SSR pages and API routes change frequently and need instant deployments. The middleware is the stable routing layer.

**Why not the OpenNext `functions` split?** That feature splits routes within a single Next.js app (AWS Lambda concept). We use fully independent Next.js apps connected via Cloudflare Service Bindings.

**Why merge static assets into middleware?** Each Next.js app generates its own chunk hashes. Service binding requests bypass the Wrangler assets layer, so the middleware serves all static assets directly from a merged directory.

**Why `pnpm patch` instead of a postinstall script?** The OpenNext adapter imports `node:crypto` which isn't available in Workers. `pnpm patch` is version-controlled, survives installs, and doesn't silently break.

## Adding a New Worker

If a worker grows too large or you need independent deployment for a set of routes, here's how to split it out.

**Example:** Extracting API routes from the SSR worker into a dedicated API worker.

### 1. Create the app

```bash
mkdir -p apps/api-worker/src/app
```

Copy the relevant routes (e.g. `src/app/api/`) and libs into the new app. Set up `package.json`, `next.config.ts`, `tsconfig.json`, `open-next.config.ts`, and `wrangler.jsonc` following the SSR worker as a template. Pick a unique worker name and dev port:

```jsonc
// apps/api-worker/wrangler.jsonc
{
  "name": "opennext-api",
  "main": ".open-next/worker.js",
  "assets": { "directory": "./.open-next/assets", "binding": "ASSETS" },
  "dev": { "port": 8791 }
}
```

### 2. Add workspace entry

The new app is automatically picked up by `pnpm-workspace.yaml` (`apps/*`). Run `pnpm install`.

### 3. Add service binding to middleware

```jsonc
// apps/middleware/wrangler.jsonc  -  add to "services" array
{ "binding": "API_WORKER", "service": "opennext-api" }
```

Update `apps/middleware/worker-configuration.d.ts`:
```typescript
interface Env {
  // ... existing bindings
  API_WORKER: Fetcher;
  API_VERSION_ID: string;
}
```

### 4. Add routing in middleware

```typescript
// apps/middleware/src/index.ts
if (pathname.startsWith('/api/')) {
  targetWorker = this.env.API_WORKER;
  versionId = this.env.API_VERSION_ID;
  workerName = 'opennext-api';
}
```

### 5. Add to dev command

```jsonc
// package.json  -  append the new config
"dev": "turbo run build:cloudflare && ./scripts/merge-assets.sh && wrangler dev -c apps/middleware/wrangler.jsonc -c apps/ssr-worker/wrangler.jsonc -c apps/ssg-worker/wrangler.jsonc -c apps/api-worker/wrangler.jsonc --local"
```

### 6. Add to deploy script

In `scripts/deploy.ts`, add the new worker to the `WORKERS` config and follow the same upload/deploy/promote pattern. Add the version ID var to the middleware's `wrangler.jsonc` and update the `updateMiddlewareVersionIds` function.

### 7. Add to merge-assets.sh

```bash
# scripts/merge-assets.sh  -  add the new worker
for worker in apps/ssr-worker apps/ssg-worker apps/api-worker; do
```

That's it. The new worker is independently deployable, has its own versioning, and participates in gradual deployments via version affinity.

## Tech Stack

- **Next.js** 16.1.7 (Turbopack)
- **@opennextjs/cloudflare** 1.17.1
- **Wrangler** 4.75.0
- **Turborepo** for build orchestration
- **pnpm** workspaces
- **TypeScript** strict mode
