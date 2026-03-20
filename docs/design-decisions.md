# Design Decisions

Documenting the "why" behind key architectural choices, including alternatives considered and trade-offs accepted.

## 1. Three workers instead of one

**Decision:** Split into Middleware + SSR + SSG workers.

**Why:**
- Independent deployment -- SSG content (marketing pages) changes on a different cadence than SSR features (cart, checkout). Deploying a blog post shouldn't risk breaking checkout.
- Independent scaling -- SSG pages are mostly served from cache. SSR pages and API routes need compute on every request. Separate workers let Cloudflare scale them independently.
- Fault isolation -- a bug in the SSR worker doesn't take down the marketing site.

**Alternatives considered:**
- **Single worker (Option A):** Simplest, but loses all the above benefits. Doesn't demonstrate multi-worker patterns.
- **Four workers (original plan):** Middleware + API + SSR + SSG. Dropped because API routes and SSR pages share data (cart store, product catalog). Keeping them separate forced HTTP round-trips from server components to the API worker. Merging them into one Next.js app is the natural pattern.

**Trade-offs:**
- Two separate `next build` runs (~20s total). Accepted because deployment independence is more valuable than build speed.
- No client-side navigation between workers. Clicking a link from an SSG page (`/about`) to an SSR page (`/cart`) triggers a full browser reload -- Next.js can't do SPA-style transitions across separate apps. If seamless navigation across all routes is critical, use a single Next.js app instead.

## 2. Plain Worker for middleware, not Next.js

**Decision:** The middleware is a vanilla Cloudflare Worker built with esbuild, not an OpenNext app.

**Why:**
- The middleware has no pages, no React, no server components. It's pure routing logic (~80 lines of TypeScript).
- Builds in 2ms (esbuild) vs ~8s (next build + opennextjs-cloudflare build).
- Smaller bundle, faster cold start.
- No dependency on OpenNext's configuration or compatibility quirks.

**Alternative considered:** Using OpenNext's built-in middleware support (`middleware.external: true`). This would make the middleware part of one of the Next.js apps. Rejected because it couples the routing layer to a specific Next.js app, and we need the middleware to route to multiple independent apps.

## 3. Merged static assets on middleware

**Decision:** At build time, copy static assets from both workers into the middleware's assets directory.

**Why:** Service binding requests bypass Wrangler's asset serving layer. When the middleware forwards `/_next/static/chunks/abc.js` to the SSR worker via service binding, the OpenNext worker code handles it (not the asset layer), and it returns a 500.

**Alternatives considered:**
- **SSR-first with SSG fallback:** Middleware tries SSR, if 404/500 tries SSG. Rejected because it doubles latency for every SSG asset and the OpenNext worker returns 500 (not 404) for missing assets.
- **Each worker serves its own assets:** Would require the middleware to know which chunks belong to which worker. Fragile and impossible to maintain as chunk hashes change every build.
- **Shared R2 bucket for assets:** Overkill for static files that are part of the build output.

**Trade-off:** Adds a build step (`merge-assets.sh`) and duplicates files on disk. The script is 15 lines of bash and runs in milliseconds. Accepted.

## 4. API routes in SSR worker, not separate

**Decision:** Merged the API worker into the SSR worker.

**Why:**
- Server components in the SSR worker need product and cart data. With a separate API worker, they'd have to `fetch('http://...')` over HTTP via service bindings. With routes in the same app, they import the data functions directly -- zero overhead.
- The cart store is in-memory. Sharing it between API routes and server components is trivial when they're in the same process. With separate workers, you'd need a Durable Object or KV for shared state.
- Client components (browser) still call `/api/cart` and `/api/checkout` via `fetch()`, which the middleware routes to the SSR worker. This works identically.

**Trade-off:** API routes and SSR pages deploy together. If you need to hotfix an API route, you also redeploy all pages. Acceptable for this application's scale.

## 5. Deploy script, not Deployment Manager DO

**Decision:** A TypeScript script that shells out to `wrangler` CLI, instead of a Durable Object managing deployment state.

**Why:**
- Cloudflare already tracks versions (`wrangler versions list`) and deployments (`wrangler deployments list`). A DO would duplicate this state.
- Rollback is built into `wrangler rollback`. No custom logic needed.
- A deployment is a one-shot sequential operation (upload, deploy, promote). There's no long-running state to coordinate.
- A DO adds a 4th worker to deploy, monitor, and maintain.

**Alternative considered:** The original implementation plan called for a Deployment Manager DO with HTTP API endpoints. This was designed before we understood how well `wrangler versions upload` + `wrangler versions deploy` handles the workflow natively.

**Trade-off:** No web UI for deployment management. You use CLI commands or the Cloudflare dashboard. Acceptable because deployments are developer-facing operations, not user-facing.

## 6. `wrangler dev -c ... -c ...` for local development

**Decision:** Use Wrangler's multi-config dev mode instead of running separate `wrangler dev` processes.

**Why:**
- Single process manages all workers and their service bindings.
- No port conflicts (Wrangler allocates ports automatically for auxiliary workers).
- Service bindings work automatically between workers.
- Matches how workers will behave in production.

**Alternative considered:**
- **Separate terminals per worker:** Caused port 9230 (inspector) conflicts. Required manual coordination of service binding ports. Fragile.
- **`concurrently` + `chokidar` watch mode:** Each file change triggered a full `next build` + `opennextjs-cloudflare build` (~10s). Not a real dev experience. Added two dependencies for no benefit.

**Trade-off:** No hot reload. Each change requires stopping and re-running `pnpm run dev`. This is a fundamental limitation of OpenNext on Cloudflare, not a choice we made. For fast iteration, use `next dev` directly on individual workers.

## 8. Version affinity via env vars, not config file rewriting

**Decision:** Store version IDs as `vars` in `wrangler.jsonc`, updated by the deploy script before uploading.

**Why:**
- Env vars are baked into the worker version at upload time. Each middleware version carries exactly the content worker version IDs it was built for.
- No runtime lookups, no external state, no race conditions.
- The deploy script writes the vars, uploads the middleware, then resets them to empty (so committed config always has empty IDs).

**Alternative considered:**
- **KV store lookup at runtime:** Middleware reads version IDs from KV on each request. Adds latency and a failure mode. Rejected.
- **Hardcoded in source code:** Would require rebuilding the middleware source (not just config) on each deploy. Rejected.

## 9. R2 for incremental cache

**Decision:** Use R2 buckets for Next.js incremental cache storage.

**Why:**
- R2 is Cloudflare's object storage, well-suited for cache entries (HTML, JSON, RSC payloads).
- The OpenNext adapter has built-in R2 support via `r2IncrementalCache`.
- No external infrastructure or API keys needed.

**Alternative considered:**
- **KV:** Faster reads but 25MB value limit and eventual consistency. R2 has no size limit and strong consistency.
- **`dummy` cache:** Disables caching entirely. Used for `tagCache` and `queue` since we don't need tag-based revalidation or queued revalidation in this demo.
