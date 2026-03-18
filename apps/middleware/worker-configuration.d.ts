// Manually maintained Env type for the middleware worker
interface Env {
  SSR_VERSION_ID: string;
  SSG_VERSION_ID: string;
  SSR_WORKER: Fetcher;
  SSG_WORKER: Fetcher;
  ASSETS: Fetcher;
}
