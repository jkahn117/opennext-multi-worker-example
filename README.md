# OpenNext Multi-Worker Project

A sample eCommerce application demonstrating multi-worker architecture with OpenNext and Cloudflare Workers.

## Architecture

This project uses a multi-worker approach where:

- **Middleware Worker** - Entry point that routes requests to appropriate content workers
- **API Worker** - Handles `/api/*` routes for cart, checkout, and product APIs
- **SSR Worker** - Server-side rendered pages (products, cart, checkout, account)
- **SSG Worker** - Static site generation pages (home, about, blog with ISR)
- **Deployment Manager** - Coordinates gradual deployments with version affinity

## Project Structure

```
opennext-multi-worker/
├── apps/
│   ├── middleware/          # Middleware worker (routing)
│   ├── api-worker/          # API routes worker
│   ├── ssr-worker/          # SSR pages worker
│   ├── ssg-worker/          # SSG pages worker
│   └── deployment-manager/  # Deployment coordination
├── packages/
│   └── shared-types/        # Shared TypeScript types
├── scripts/                 # Deployment scripts
└── docs/                    # Documentation
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Cloudflare account
- Wrangler CLI authenticated

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp apps/middleware/example.wrangler.toml apps/middleware/wrangler.toml
   # Edit wrangler.toml with your Cloudflare account details
   ```

3. Build all workers:
   ```bash
   pnpm build:cloudflare
   ```

4. Deploy:
   ```bash
   pnpm deploy
   ```

## Documentation

- [Architecture](./docs/architecture.md)
- [Development](./docs/development.md)
- [Deployment](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Platform**: Cloudflare Workers
- **Adapter**: @opennextjs/cloudflare
- **Build**: Turborepo + pnpm workspaces
- **Language**: TypeScript (strict mode)

## License

MIT
