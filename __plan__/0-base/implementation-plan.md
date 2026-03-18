# OpenNext Multi-Worker Implementation Plan

## Executive Summary

Build an eCommerce sample application using OpenNext with Cloudflare adapter, featuring:
- **1 Middleware Worker** - Entry point, routing via Service Bindings
- **3 Content Workers** - API routes, SSR pages, SSG pages
- **1 Deployment Manager** - Worker + Durable Object for version coordination
- **R2 caching** for incremental cache
- **Full gradual deployment** with version affinity

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Worker (Edge)                   │
│  • Next.js middleware processing                            │
│  • Path-based routing logic                                 │
│  • Service Binding fetch() to content workers               │
│  • Version affinity header injection                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ Service Bindings
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  API Worker   │  │  SSR Worker   │  │  SSG Worker   │
│  (Node)       │  │  (Node)       │  │  (Edge/Node)  │
│  • /api/*     │  │  • /products  │  │  • /static    │
│  • Cart API   │  │  • /cart      │  │  • /about     │
│  • Checkout   │  │  • Dynamic    │  │  • ISR pages  │
└───────────────┘  └───────────────┘  └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Deployment Manager (Durable Object)             │
│  • Version registry                                         │
│  • Deployment coordination                                  │
│  • Rollback management                                      │
└─────────────────────────────────────────────────────────────┘
```

## Worker Specifications

### 1. Middleware Worker (`apps/middleware`)
**Responsibilities:**
- Face of the application (receives all requests)
- Next.js middleware execution
- Path-based routing to content workers via Service Bindings
- Version affinity header injection
- Static asset serving

**Routing Logic:**
```typescript
// Pseudocode for routing
if (path.startsWith('/api/')) {
  return env.API_WORKER.fetch(request);
} else if (path.startsWith('/products') || path === '/cart' || path === '/checkout') {
  return env.SSR_WORKER.fetch(request);
} else {
  return env.SSG_WORKER.fetch(request);
}
```

**Configuration:**
- Wrapper: `cloudflare-edge`
- Converter: `edge`
- Assets binding for `.open-next/assets`
- Service bindings: `API_WORKER`, `SSR_WORKER`, `SSG_WORKER`

### 2. API Content Worker (`apps/api-worker`)
**Responsibilities:**
- Handle all `/api/*` routes
- Cart operations (add, remove, get)
- Checkout API
- Product search API
- Session management

**Routes:**
- `GET/POST /api/cart` - Cart operations
- `POST /api/checkout` - Checkout process
- `GET /api/products` - Product listing/search
- `GET /api/products/[id]` - Product details

**Configuration:**
- Wrapper: `cloudflare-node`
- Converter: `edge`

### 3. SSR Content Worker (`apps/ssr-worker`)
**Responsibilities:**
- Server-side rendered pages
- Dynamic product pages
- Cart page (server-rendered with initial state)
- Checkout page
- User dashboard

**Routes:**
- `/products` - Product listing
- `/products/[slug]` - Product detail (SSR)
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/account` - User account

**Configuration:**
- Wrapper: `cloudflare-node`
- Converter: `edge`

### 4. SSG Content Worker (`apps/ssg-worker`)
**Responsibilities:**
- Static site generation pages
- Marketing pages
- Blog posts (ISR)
- About, contact, FAQ pages

**Routes:**
- `/` - Home page
- `/about` - About page
- `/blog` - Blog listing
- `/blog/[slug]` - Blog posts (ISR)
- `/faq` - FAQ page

**Configuration:**
- Wrapper: `cloudflare-edge` (for static) or `cloudflare-node`
- Converter: `edge`
- ISR enabled for blog posts

### 5. Deployment Manager (`apps/deployment-manager`)
**Components:**
- **Worker**: HTTP API for deployment operations
- **Durable Object**: State management for versions

**Responsibilities:**
- Store and retrieve worker version IDs
- Coordinate gradual deployments
- Track deployment status
- Provide rollback capabilities
- Validate version compatibility

**API Endpoints:**
- `POST /deploy/start` - Start new deployment
- `GET /deploy/status` - Get deployment status
- `POST /deploy/complete` - Mark deployment complete
- `POST /deploy/rollback` - Rollback to previous version
- `GET /versions` - List all versions

## Service Bindings Configuration

### Middleware Worker Service Bindings
```toml
[[services]]
binding = "API_WORKER"
service = "opennext-api"

[[services]]
binding = "SSR_WORKER"
service = "opennext-ssr"

[[services]]
binding = "SSG_WORKER"
service = "opennext-ssg"

[[services]]
binding = "DEPLOYMENT_MANAGER"
service = "opennext-deployment"
```

### Usage in Middleware Worker
```typescript
export default class extends WorkerEntrypoint {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Add version affinity headers
    const modifiedRequest = new Request(request);
    modifiedRequest.headers.set(
      "Cloudflare-Workers-Version-Overrides",
      `api="${this.env.API_VERSION_ID}",ssr="${this.env.SSR_VERSION_ID}",ssg="${this.env.SSG_VERSION_ID}"`
    );
    
    // Route via Service Bindings
    if (url.pathname.startsWith('/api/')) {
      return this.env.API_WORKER.fetch(modifiedRequest);
    } else if (url.pathname.startsWith('/products') || url.pathname === '/cart') {
      return this.env.SSR_WORKER.fetch(modifiedRequest);
    } else {
      return this.env.SSG_WORKER.fetch(modifiedRequest);
    }
  }
}
```

## Repository Structure

```
opennext-multi-worker/
├── apps/
│   ├── middleware/
│   │   ├── src/
│   │   │   ├── index.ts          # Worker entrypoint
│   │   │   └── middleware.ts     # Next.js middleware
│   │   ├── wrangler.toml         # Middleware worker config
│   │   └── package.json
│   │
│   ├── api-worker/
│   │   ├── src/
│   │   │   ├── index.ts          # Worker entrypoint
│   │   │   └── routes/           # API route handlers
│   │   ├── open-next.config.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── ssr-worker/
│   │   ├── src/
│   │   │   ├── app/              # Next.js app directory
│   │   │   │   ├── products/
│   │   │   │   ├── cart/
│   │   │   │   ├── checkout/
│   │   │   │   └── account/
│   │   │   └── index.ts          # Worker entrypoint
│   │   ├── open-next.config.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── ssg-worker/
│   │   ├── src/
│   │   │   ├── app/              # Next.js app directory
│   │   │   │   ├── page.tsx      # Home
│   │   │   │   ├── about/
│   │   │   │   ├── blog/
│   │   │   │   └── faq/
│   │   │   └── index.ts          # Worker entrypoint
│   │   ├── open-next.config.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── deployment-manager/
│       ├── src/
│       │   ├── index.ts          # Worker HTTP API
│       │   └── deployment-do.ts  # Durable Object
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   └── shared-types/             # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts
│       │   ├── products.ts
│       │   └── cart.ts
│       └── package.json
│
├── scripts/
│   ├── deploy.sh                 # Main deployment script
│   ├── deploy-worker.sh          # Individual worker deployment
│   └── extract-version.js        # Version extraction helper
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── development.md
│   └── troubleshooting.md
│
├── package.json                  # Root with pnpm workspace
├── pnpm-workspace.yaml
├── turbo.json                    # Build orchestration
└── README.md
```

## Technology Stack

### Core
- **Runtime**: Cloudflare Workers
- **Framework**: Next.js 14+ (App Router)
- **Adapter**: @opennextjs/cloudflare
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm

### Build & Deploy
- **Build Orchestration**: Turborepo
- **CLI**: Wrangler v4.43.0+
- **Deployment**: Gradual deployments with version affinity

### Communication
- **Inter-worker**: Cloudflare Service Bindings (native fetch API)
- **HTTP**: Native fetch API

### Storage
- **Incremental Cache**: Cloudflare R2
- **Deployment State**: Durable Objects (SQLite)

### Development
- **Linting**: ESLint
- **Formatting**: Prettier

## Deployment Strategy

### Gradual Deployment Flow

```
Phase 1: Upload Content Workers
├─ Upload API Worker → Get API_VERSION_ID
├─ Upload SSR Worker → Get SSR_VERSION_ID
└─ Upload SSG Worker → Get SSG_VERSION_ID

Phase 2: Update Middleware Configuration
└─ Update middleware wrangler.toml with new version IDs

Phase 3: Upload Middleware Worker
└─ Upload Middleware → Get MIDDLEWARE_VERSION_ID

Phase 4: Register with Deployment Manager
└─ Register new versions in Deployment DO

Phase 5: Gradual Rollout
├─ Deploy Content Workers at 0%
├─ Deploy Middleware at 100% (with version headers)
└─ Deploy Content Workers at 100%
```

### Version Affinity

The middleware injects version headers for each content worker:
```
Cloudflare-Workers-Version-Overrides: api="API_VERSION_ID", ssr="SSR_VERSION_ID", ssg="SSG_VERSION_ID"
```

This ensures requests are routed to compatible worker versions during rollouts.

## Implementation Phases

### Phase 1: Project Setup
- Initialize monorepo with pnpm workspaces
- Set up Turborepo configuration
- Create shared types package
- Configure TypeScript strict mode

### Phase 2: Content Workers
- Create API Worker with cart/checkout/product routes
- Create SSR Worker with eCommerce pages
- Create SSG Worker with marketing/blog pages
- Configure OpenNext for each worker
- Set up R2 incremental cache

### Phase 3: Middleware Worker
- Implement routing logic using Service Bindings
- Add version affinity header injection
- Configure service bindings in wrangler.toml

### Phase 4: Deployment Manager
- Build Durable Object for version tracking
- Create Worker API for deployment operations
- Implement deployment coordination logic

### Phase 5: Deployment Scripts
- Create deployment automation scripts
- Implement version extraction from wrangler output
- Build gradual deployment orchestration
- Add rollback capabilities

### Phase 6: Documentation
- Architecture diagrams
- Step-by-step setup guide
- Deployment instructions
- Troubleshooting guide

## Key Design Decisions

### 1. Monorepo Structure
**Rationale**: Clean separation of concerns, independent versioning, and shared code reuse.

### 2. Service Bindings for Communication
**Rationale**: Native Cloudflare feature, zero overhead, simple `fetch()` API, automatic routing to correct worker versions when combined with version affinity headers.

### 3. Separate Content Workers
**Rationale**: 
- Independent scaling based on traffic patterns
- Isolated deployments for API vs. content changes
- Reduced memory footprint per worker
- Clear separation of concerns

### 4. Deployment Manager DO
**Rationale**: Centralized state management for versions, coordination point for gradual deployments, persistent storage for rollback history.

### 5. Path-Based Routing in Middleware
**Rationale**: Single entry point, consistent routing logic, easy to add new content workers.

## Success Criteria

- [ ] All 5 workers deploy successfully
- [ ] Service Bindings work between middleware and content workers
- [ ] Version affinity headers route requests correctly
- [ ] R2 incremental cache functions properly
- [ ] Gradual deployment completes without downtime
- [ ] Rollback mechanism works
- [ ] Documentation is comprehensive and clear
- [ ] eCommerce demo app is functional

## Risk Mitigation

1. **Version Mismatch**: Strict version affinity headers prevent routing to incompatible workers
2. **Deployment Failures**: Deployment Manager DO tracks state and enables rollback
3. **Cold Start Latency**: Edge workers for middleware and SSG reduce cold starts
4. **Cache Invalidation**: R2 cache with proper tag management (future enhancement)
