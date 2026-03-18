import { WorkerEntrypoint } from 'cloudflare:workers';

export default class MiddlewareWorker extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    console.log(`[Middleware] Routing request: ${request.method} ${pathname}`);

    try {
      let targetWorker: Fetcher;
      let versionId: string;
      let workerName: string;

      if (this.isSSGRoute(pathname)) {
        targetWorker = this.env.SSG_WORKER;
        versionId = this.env.SSG_VERSION_ID;
        workerName = 'opennext-ssg';
        console.log(`[Middleware] Routing to SSG Worker`);
      } else if (pathname.startsWith('/_next/')) {
        // Static assets served directly from middleware's merged ASSETS binding
        return this.env.ASSETS.fetch(request);
      } else {
        // Everything else (API routes, /products, /cart, /checkout, /account, etc.)
        targetWorker = this.env.SSR_WORKER;
        versionId = this.env.SSR_VERSION_ID;
        workerName = 'opennext-ssr';
        console.log(`[Middleware] Routing to SSR Worker`);
      }

      const modifiedRequest = new Request(request);

      if (versionId) {
        modifiedRequest.headers.set(
          'Cloudflare-Workers-Version-Overrides',
          `${workerName}="${versionId}"`
        );
      }

      const response = await targetWorker.fetch(modifiedRequest);
      return this.addHeaders(response, workerName);
    } catch (error) {
      console.error('[Middleware] Error routing request:', error);

      return Response.json(
        {
          success: false,
          error: {
            code: 'ROUTING_ERROR',
            message: error instanceof Error ? error.message : 'Routing failed',
          },
        },
        {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
  }

  private isSSGRoute(pathname: string): boolean {
    return (
      pathname === '/' ||
      pathname.startsWith('/blog') ||
      pathname === '/about' ||
      pathname === '/faq'
    );
  }

  private addHeaders(response: Response, workerName: string): Response {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cart-id',
        'X-Routed-By': 'middleware',
        'X-Worker-Target': workerName,
      },
    });
  }
}
