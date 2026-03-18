/**
 * Multi-worker deployment script for OpenNext on Cloudflare.
 *
 * Orchestrates uploading and deploying 3 workers with version affinity:
 *   1. Upload content workers (SSR, SSG) → get version IDs
 *   2. Deploy content workers at 0% (makes versions available for affinity)
 *   3. Upload middleware with version IDs passed via --var (no file mutation)
 *   4. Deploy middleware at 100%
 *   5. Promote content workers to 100%
 *
 * Usage:
 *   tsx scripts/deploy.ts              # Full deploy with gradual rollout
 *   tsx scripts/deploy.ts --init       # First deploy (creates workers)
 *   tsx scripts/deploy.ts --dry-run    # Show what would happen
 */

import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const WORKERS = {
  ssr: {
    name: "opennext-ssr",
    config: "apps/ssr-worker/wrangler.jsonc",
  },
  ssg: {
    name: "opennext-ssg",
    config: "apps/ssg-worker/wrangler.jsonc",
  },
  middleware: {
    name: "opennext-middleware",
    config: "apps/middleware/wrangler.jsonc",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const isInit = args.includes("--init");
const isDryRun = args.includes("--dry-run");

function log(msg: string): void {
  console.log(`\n[deploy] ${msg}`);
}

function run(cmd: string): string {
  if (isDryRun) {
    console.log(`  [dry-run] ${cmd}`);
    return "";
  }
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

function runPassthrough(cmd: string): void {
  if (isDryRun) {
    console.log(`  [dry-run] ${cmd}`);
    return;
  }
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: "inherit" });
}

/**
 * Parse version ID from `wrangler versions upload` output.
 * Expected line: "Worker Version ID: <uuid>"
 */
function parseVersionId(output: string): string {
  const match = output.match(/Worker Version ID:\s+([0-9a-f-]+)/i);
  if (!match) {
    try {
      const json = JSON.parse(output);
      if (json.id) return json.id;
    } catch {
      // not JSON
    }
    throw new Error(`Could not parse version ID from output:\n${output}`);
  }
  return match[1];
}

/**
 * Get the currently deployed version IDs for a worker.
 */
function getCurrentVersions(workerName: string): { id: string; percentage: number }[] {
  if (isDryRun) return [{ id: "current-version-placeholder", percentage: 100 }];

  try {
    const output = run(`wrangler deployments list --name ${workerName} --json`);
    const deployments = JSON.parse(output);
    if (deployments.length > 0 && deployments[0].versions) {
      return deployments[0].versions.map((v: { version_id: string; percentage: number }) => ({
        id: v.version_id,
        percentage: v.percentage,
      }));
    }
  } catch {
    console.log(`  Warning: Could not get current versions for ${workerName}`);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build(): void {
  log("Building all workers...");
  runPassthrough("turbo run build:cloudflare");

  log("Merging static assets...");
  runPassthrough("./scripts/merge-assets.sh");

  log("Building middleware...");
  runPassthrough("pnpm --filter @opennext-shop/middleware build");
}

// ---------------------------------------------------------------------------
// First deploy (--init)
// ---------------------------------------------------------------------------

function deployInit(): void {
  log("=== First Deploy (--init) ===");
  log("Creating workers with wrangler deploy...");

  // Deploy content workers first (middleware depends on them via service bindings)
  for (const key of ["ssr", "ssg"] as const) {
    const worker = WORKERS[key];
    log(`Deploying ${worker.name}...`);
    runPassthrough(`wrangler deploy -c ${worker.config}`);
  }

  // Get the version IDs of the just-deployed content workers
  log("Getting deployed version IDs...");
  const ssrVersions = getCurrentVersions(WORKERS.ssr.name);
  const ssgVersions = getCurrentVersions(WORKERS.ssg.name);

  const ssrVersionId = ssrVersions[0]?.id ?? "";
  const ssgVersionId = ssgVersions[0]?.id ?? "";

  log(`SSR version: ${ssrVersionId}`);
  log(`SSG version: ${ssgVersionId}`);

  // Deploy middleware with version IDs injected via --var
  log(`Deploying ${WORKERS.middleware.name} with version IDs...`);
  runPassthrough(
    `wrangler deploy -c ${WORKERS.middleware.config}` +
    ` --var SSR_VERSION_ID:${ssrVersionId}` +
    ` --var SSG_VERSION_ID:${ssgVersionId}`
  );

  log("=== First deploy complete ===");
  printStatus();
}

// ---------------------------------------------------------------------------
// Gradual deploy (default)
// ---------------------------------------------------------------------------

function deployGradual(): void {
  log("=== Gradual Deployment ===");

  // Step 1: Upload content worker versions
  log("Step 1/5: Uploading content worker versions...");

  const ssrOutput = run(`wrangler versions upload -c ${WORKERS.ssr.config} --message "deploy"`);
  const ssrVersionId = isDryRun ? "ssr-new-version-id" : parseVersionId(ssrOutput);
  log(`SSR version uploaded: ${ssrVersionId}`);

  const ssgOutput = run(`wrangler versions upload -c ${WORKERS.ssg.config} --message "deploy"`);
  const ssgVersionId = isDryRun ? "ssg-new-version-id" : parseVersionId(ssgOutput);
  log(`SSG version uploaded: ${ssgVersionId}`);

  // Step 2: Deploy content workers with new version at 0%
  // This makes the version available for version affinity headers
  log("Step 2/5: Deploying content workers at 0% (activating versions)...");

  const ssrCurrent = getCurrentVersions(WORKERS.ssr.name);
  const ssgCurrent = getCurrentVersions(WORKERS.ssg.name);

  if (ssrCurrent.length > 0) {
    const currentId = ssrCurrent[0].id;
    run(
      `wrangler versions deploy ${currentId}@100% ${ssrVersionId}@0% --name ${WORKERS.ssr.name} --message "activate new version" -y`
    );
  }

  if (ssgCurrent.length > 0) {
    const currentId = ssgCurrent[0].id;
    run(
      `wrangler versions deploy ${currentId}@100% ${ssgVersionId}@0% --name ${WORKERS.ssg.name} --message "activate new version" -y`
    );
  }

  // Step 3: Upload middleware with version IDs injected via --var (no file mutation)
  log("Step 3/5: Uploading middleware with new version IDs...");

  const mwOutput = run(
    `wrangler versions upload -c ${WORKERS.middleware.config}` +
    ` --var SSR_VERSION_ID:${ssrVersionId}` +
    ` --var SSG_VERSION_ID:${ssgVersionId}` +
    ` --message "deploy"`
  );
  const mwVersionId = isDryRun ? "mw-new-version-id" : parseVersionId(mwOutput);
  log(`Middleware version uploaded: ${mwVersionId}`);

  // Step 4: Deploy middleware at 100%
  // All traffic now goes through new middleware, which pins content workers via headers
  log("Step 4/5: Deploying middleware at 100%...");
  run(
    `wrangler versions deploy ${mwVersionId}@100% --name ${WORKERS.middleware.name} --message "deploy with version affinity" -y`
  );

  // Step 5: Promote content workers to 100%
  log("Step 5/5: Promoting content workers to 100%...");
  run(
    `wrangler versions deploy ${ssrVersionId}@100% --name ${WORKERS.ssr.name} --message "promote to 100%" -y`
  );
  run(
    `wrangler versions deploy ${ssgVersionId}@100% --name ${WORKERS.ssg.name} --message "promote to 100%" -y`
  );

  log("=== Gradual deployment complete ===");
  printStatus();
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

function printStatus(): void {
  log("Current deployment status:");
  for (const key of ["middleware", "ssr", "ssg"] as const) {
    const worker = WORKERS[key];
    console.log(`\n--- ${worker.name} ---`);
    try {
      runPassthrough(`wrangler deployments list --name ${worker.name}`);
    } catch {
      console.log("  (no deployments yet)");
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("OpenNext Multi-Worker Deployment");
  console.log("================================");

  if (isDryRun) {
    console.log("DRY RUN - no changes will be made\n");
  }

  build();

  if (isInit) {
    deployInit();
  } else {
    deployGradual();
  }
}

main();
