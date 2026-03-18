# Deployment Plan

## Current State

We have 3 workers running locally via `wrangler dev -c ... -c ...`:

| Worker | Role | Config |
|---|---|---|
| `opennext-middleware` | Routing + static assets | `apps/middleware/wrangler.jsonc` |
| `opennext-ssr` | SSR pages + API routes | `apps/ssr-worker/wrangler.jsonc` |
| `opennext-ssg` | SSG/ISR marketing pages | `apps/ssg-worker/wrangler.jsonc` |

## Goal

Deploy all 3 workers to Cloudflare with **gradual deployment** support and **version affinity** to prevent mismatched versions during rollouts.

## How Gradual Deployment Works

Cloudflare's gradual deployment lets you split traffic between two versions of a worker. The key commands:

```bash
# Upload a version without deploying it
wrangler versions upload -c wrangler.jsonc

# Deploy with traffic split
wrangler versions deploy <old-version>@90% <new-version>@10% -y --name worker-name

# Promote to 100%
wrangler versions deploy <new-version>@100% -y --name worker-name
```

### Version Affinity

The middleware injects `Cloudflare-Workers-Version-Overrides` headers to pin downstream workers to specific versions. This prevents a request hitting new-middleware + old-ssr during a rollout.

**Critical constraint:** A version override only works if that version is in the worker's current deployment. So content workers must be deployed (even at 0%) before the middleware can reference them.

## Deployment Sequence

```
1. Upload SSR worker version    → SSR_VERSION_ID
2. Upload SSG worker version    → SSG_VERSION_ID
3. Deploy SSR at 0% new / 100% current
4. Deploy SSG at 0% new / 100% current
5. Update middleware env vars with new version IDs
6. Upload middleware version     → MW_VERSION_ID
7. Deploy middleware at 100% (version affinity ensures correct routing)
8. Deploy SSR at 100% new
9. Deploy SSG at 100% new
```

Steps 1-4 make the new versions available without serving traffic.
Step 5-7 route all traffic through the new middleware, which pins requests to the new content worker versions via headers.
Steps 8-9 clean up the split so there's only one active version per worker.

## Implementation: Deploy Script

A single `scripts/deploy.ts` TypeScript script that:

1. Builds all workers (`turbo run build:cloudflare`)
2. Merges static assets (`scripts/merge-assets.sh`)
3. Builds middleware (`pnpm --filter @opennext-shop/middleware build`)
4. Uploads each worker version using `wrangler versions upload`
5. Parses version IDs from wrangler output
6. Executes the deployment sequence above

### Why a script, not a Durable Object?

The original plan called for a Deployment Manager DO. This is unnecessary complexity:

- **Version state is already tracked by Cloudflare.** `wrangler versions list` and `wrangler deployments list` show all versions and active deployments.
- **Rollback is built-in.** `wrangler rollback` or `wrangler versions deploy <old>@100%` handles it.
- **No persistent coordination needed.** A deployment is a one-shot sequential operation, not a long-running stateful process.

A script that shells out to `wrangler` is simpler, more debuggable, and doesn't require its own worker to be deployed and maintained.

### Version ID Extraction

`wrangler versions upload` outputs something like:
```
Worker Version ID: dc8dcd28-271b-4367-9840-6c244f84cb40
```

The script parses this from stdout. If the format changes, it's one regex to update.

### Updating Middleware Env Vars

The middleware's `wrangler.jsonc` has `SSR_VERSION_ID` and `SSG_VERSION_ID` vars. The deploy script:

1. Reads `apps/middleware/wrangler.jsonc`
2. Updates the version ID values
3. Writes it back
4. Uploads the middleware version (which includes the updated vars)

This is the same approach GitBook uses in their `updateWrangler.ts` script.

## Rollback

To rollback any worker:

```bash
# Rollback SSR worker to previous version
wrangler rollback --name opennext-ssr

# Or explicitly deploy a specific old version
wrangler versions deploy <old-version-id>@100% --name opennext-ssr -y
```

For a full rollback (all workers), re-run the deploy script with the previous commit, or keep track of the previous version IDs and deploy them.

## Package.json Scripts

```json
{
  "deploy": "tsx scripts/deploy.ts",
  "deploy:status": "wrangler deployments list --name opennext-middleware && wrangler deployments list --name opennext-ssr && wrangler deployments list --name opennext-ssg"
}
```

## Prerequisites

- Cloudflare account with Workers paid plan (for gradual deployments)
- `CLOUDFLARE_API_TOKEN` env var set (or `wrangler login` completed)
- R2 buckets created: `opennext-ssr-cache`, `opennext-ssg-cache`
- Workers must already exist (first deploy uses `wrangler deploy` to create them)

## First Deploy vs Subsequent Deploys

**First deploy** (`deploy --init`):
- Uses `wrangler deploy` for each worker (creates the worker)
- No gradual deployment (nothing to split traffic with)

**Subsequent deploys** (`deploy`):
- Uses `wrangler versions upload` + `wrangler versions deploy`
- Gradual deployment with version affinity

## File Changes

| File | Change |
|---|---|
| `scripts/deploy.ts` | **New** - Main deployment orchestration script |
| `package.json` | Add `deploy` and `deploy:status` scripts, add `tsx` devDependency |
| `apps/middleware/wrangler.jsonc` | Version ID vars get updated by deploy script |

## Open Questions

1. **Static assets during gradual deployment.** The middleware serves merged assets from both workers. During a rollout, old and new versions may reference different chunk hashes. Should we keep assets from both the current and new builds during the transition? (The Cloudflare docs note this is a known issue with gradual deployments + static assets.)

2. **First deploy bootstrapping.** Do we need a separate `deploy --init` path, or can we detect whether the workers exist and choose `wrangler deploy` vs `wrangler versions upload` automatically?

3. **CI/CD.** Should the script be designed to run in GitHub Actions from the start, or keep it local-first and add CI later?
