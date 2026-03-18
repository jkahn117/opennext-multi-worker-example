# Development

## Setup

```bash
# Clone and install
pnpm install

# Run all workers locally
pnpm run dev
```

`pnpm run dev` does three things:
1. `turbo run build:cloudflare` -- builds Next.js apps and runs the OpenNext adapter for each worker
2. `./scripts/merge-assets.sh` -- copies static assets from SSR + SSG into the middleware's `.assets/` directory
3. `wrangler dev -c ... -c ... -c ...` -- starts all 3 workers in a single Wrangler process

The middleware is the **primary** worker (exposed at http://localhost:8790). SSR and SSG are **auxiliary** workers, reachable via service bindings from the middleware.

## Making Changes

There is no hot reload. After changing source files, stop the dev server (Ctrl+C) and re-run `pnpm run dev`.

This is a limitation of OpenNext on Cloudflare -- each change requires a full `next build` + `opennextjs-cloudflare build`. For faster iteration on individual workers, run `next dev` directly:

```bash
# Fast iteration on SSR worker pages/components
cd apps/ssr-worker && pnpm next dev --port 3001

# Fast iteration on SSG worker pages
cd apps/ssg-worker && pnpm next dev --port 3002
```

This gives you Next.js hot reload but without the Workers runtime or service bindings. Use `pnpm run dev` for integration testing.

## Project Layout

### `apps/middleware/`

Plain Cloudflare Worker. Not a Next.js app.

| File | Purpose |
|---|---|
| `src/index.ts` | `WorkerEntrypoint` with routing logic |
| `wrangler.jsonc` | Service bindings, assets directory, dev port |
| `worker-configuration.d.ts` | TypeScript `Env` interface (manually maintained) |
| `dist/index.js` | Build output (esbuild) |
| `.assets/` | Merged static assets (generated, gitignored) |

Built with: `esbuild src/index.ts --bundle --format=esm --external:cloudflare:workers`

### `apps/ssr-worker/`

Next.js 16 app with API routes and dynamic pages.

| Directory | Purpose |
|---|---|
| `src/app/products/` | Product listing and detail pages |
| `src/app/cart/` | Cart page (server component reads cookie, fetches cart) |
| `src/app/checkout/` | Checkout page |
| `src/app/account/` | Account page |
| `src/app/api/` | API routes (products, cart, checkout, health) |
| `src/components/` | React components (Header, CartItems, AddToCartButton, CheckoutForm) |
| `src/lib/mock-data.ts` | Product catalog (in-memory) |
| `src/lib/cart-store.ts` | Cart state (in-memory) |
| `src/lib/api-client.ts` | Server-side data access (imports mock-data directly, no HTTP) |
| `src/lib/api-utils.ts` | API response helpers |

### `apps/ssg-worker/`

Next.js 16 app with static and ISR pages.

| Directory | Purpose |
|---|---|
| `src/app/page.tsx` | Home page |
| `src/app/blog/` | Blog listing + `[slug]` pages (ISR with 60s revalidation) |
| `src/app/about/` | About page |
| `src/app/faq/` | FAQ page |
| `src/lib/blog-data.ts` | Blog post content |
| `src/components/` | Header, Footer (different nav from SSR) |

### `packages/shared-types/`

TypeScript interfaces shared across workers. Compiled to JS by `tsc`.

### `scripts/`

| Script | Purpose |
|---|---|
| `deploy.ts` | Deployment orchestration (upload, version affinity, gradual rollout) |
| `merge-assets.sh` | Copies static assets from SSR + SSG into middleware |

## Conventions

- **TypeScript strict mode** everywhere
- **2-space indentation** for TS/JS and YAML
- **Functional patterns** preferred over imperative
- **`unknown` over `any`** -- use type assertions (`as Type`) where needed
- **Conventional Commits** -- `feat(scope): description`, `fix(scope): description`
- **No secrets in code** -- use env vars via `wrangler.jsonc` `vars` or Cloudflare secrets

## Common Issues

### `node:crypto` error during OpenNext build

Fixed by `pnpm patch`. The patch replaces `node:crypto` import in OpenNext's `internal.js` with a DJB2 hash function. If you upgrade `@opennextjs/cloudflare`, you may need to re-create the patch:

```bash
pnpm patch @opennextjs/cloudflare@<new-version>
# Edit the file, then:
pnpm patch-commit '<path-shown-by-pnpm>'
```

### Static asset 404s

If you see 404s for `/_next/static/chunks/*.js`, the merged assets directory is stale. Re-run `pnpm run dev` which rebuilds and re-merges.

### Port conflicts

If port 9230 (Wrangler inspector) is already in use, kill the old process:
```bash
lsof -ti:9230 | xargs kill -9
```

### LSP errors for `apps/api-worker`

These are stale LSP references. The `api-worker` directory was deleted (merged into SSR worker). Restart your editor's TypeScript server.
