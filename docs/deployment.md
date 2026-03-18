# Deployment

## Prerequisites

- Cloudflare account with Workers paid plan (required for gradual deployments)
- `wrangler login` completed, or `CLOUDFLARE_API_TOKEN` env var set
- R2 buckets created: `opennext-ssr-cache` and `opennext-ssg-cache`

## First Deploy

The first deploy creates the workers on Cloudflare using `wrangler deploy`:

```bash
pnpm run deploy:init
```

This:
1. Builds all workers (Next.js + OpenNext adapter + middleware)
2. Merges static assets
3. Deploys SSR and SSG workers (creates them on Cloudflare)
4. Reads back their version IDs
5. Updates middleware config with those version IDs
6. Rebuilds and deploys middleware

After this, all 3 workers are live and the middleware routes requests with version affinity.

## Subsequent Deploys

After the first deploy, use the gradual deployment flow:

```bash
pnpm run deploy
```

### What happens

The deploy script (`scripts/deploy.ts`) runs a 5-step sequence:

**Step 1: Upload content worker versions**
```
wrangler versions upload -c apps/ssr-worker/wrangler.jsonc
wrangler versions upload -c apps/ssg-worker/wrangler.jsonc
```
Creates new versions without deploying them. Parses the version IDs from output.

**Step 2: Deploy content workers at 0%**
```
wrangler versions deploy <current>@100% <new>@0% --name opennext-ssr -y
wrangler versions deploy <current>@100% <new>@0% --name opennext-ssg -y
```
Makes the new versions available in the deployment (required for version affinity to work) without routing any traffic to them yet.

**Step 3: Update and upload middleware**
- Writes new version IDs into `apps/middleware/wrangler.jsonc` as env vars
- Rebuilds the middleware
- Uploads as a new version

**Step 4: Deploy middleware at 100%**
```
wrangler versions deploy <new-mw>@100% --name opennext-middleware -y
```
All traffic now flows through the new middleware, which pins every request to the new content worker versions via the `Cloudflare-Workers-Version-Overrides` header.

**Step 5: Promote content workers to 100%**
```
wrangler versions deploy <new>@100% --name opennext-ssr -y
wrangler versions deploy <new>@100% --name opennext-ssg -y
```
Cleans up the split deployment. Now only the new version is active.

### Why this order?

The content workers must be in an active deployment (even at 0%) before the middleware can reference their version IDs in the affinity header. If a version isn't in the deployment, the header is silently ignored and Cloudflare routes based on the traffic split percentages.

## Dry Run

Preview what the deploy script will do without making any changes:

```bash
pnpm run deploy:dry-run
```

## Check Status

See the active deployments for all workers:

```bash
pnpm run deploy:status
```

Or for a specific worker:

```bash
wrangler deployments list --name opennext-ssr
wrangler versions list --name opennext-ssr
```

## Rollback

### Rollback a single worker

```bash
wrangler rollback --name opennext-ssr
```

This promotes the previous version to 100%.

### Rollback to a specific version

```bash
# List recent versions
wrangler versions list --name opennext-ssr

# Deploy a specific version at 100%
wrangler versions deploy <version-id>@100% --name opennext-ssr -y
```

### Full rollback (all workers)

Re-run the deploy from a previous commit, or manually deploy old versions:

```bash
wrangler versions deploy <old-ssr-id>@100% --name opennext-ssr -y
wrangler versions deploy <old-ssg-id>@100% --name opennext-ssg -y
wrangler versions deploy <old-mw-id>@100% --name opennext-middleware -y
```

Order matters: deploy the middleware last so it doesn't reference version IDs that are no longer active.

## Version Affinity Deep Dive

The `Cloudflare-Workers-Version-Overrides` header is a [Dictionary Structured Header](https://www.rfc-editor.org/rfc/rfc8941#name-dictionaries). Each key is a worker name, each value is a version ID:

```
Cloudflare-Workers-Version-Overrides: opennext-ssr="dc8dcd28-271b-4367-9840-6c244f84cb40"
```

Key rules:
- The key must match the worker's `name` field in `wrangler.jsonc`, not the service binding name
- The version must be in the worker's current deployment (active at any percentage)
- If the header is malformed or the version isn't deployed, it's silently ignored
- The header is consumed by the Cloudflare runtime and not forwarded to the target worker

## Static Assets During Deployment

During a gradual deployment, old and new versions may reference different chunk hashes. The middleware serves assets from a merged directory built at deploy time. Since the deploy script rebuilds everything before uploading, the merged assets contain chunks from the latest build only.

This means: during the brief window between deploying the new middleware (step 4) and promoting content workers (step 5), the old content worker versions might reference chunks that no longer exist in the middleware's assets. In practice this window is seconds, and browsers cache chunks aggressively, so this is rarely an issue.

For zero-downtime asset serving, you could keep assets from both current and new builds in the merged directory. This is not implemented but would be straightforward to add to `merge-assets.sh`.

## CI/CD

The deploy script is designed to run locally or in CI. For GitHub Actions:

```yaml
- name: Deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  run: pnpm run deploy
```

No interactive prompts -- the script uses `-y` flags on all wrangler commands.
