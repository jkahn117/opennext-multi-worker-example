# OpenNext Multi-Worker Research

## Overview

This document outlines the research findings for building a multi-worker OpenNext project deployed with the Cloudflare adapter. The architecture splits an OpenNext application across multiple Cloudflare Workers to improve performance and reduce memory footprint.

## Architecture

### Worker Separation

The multi-worker approach involves splitting the application into specialized workers:

1. **Middleware Worker** - Handles Next.js middleware, OpenNext routing layer, ISR/SSG cache hits, redirects, and request preprocessing
2. **Server Worker** - Handles dynamic content, SSR pages, and API routes
3. **Durable Objects Workers** - Manage stateful operations like queue handling and tag cache

### Request Flow

```
Client Request
    ↓
Middleware Worker
    ↓ (if middleware returns Response)
Direct Response (redirects, blocks, ISR/SSG cache hits)
    ↓ (if middleware returns modified Request)
Server Worker (via Service Binding with Version Affinity)
    ↓
Dynamic Content Response
```

## Key Components

### 1. OpenNext Configuration

The configuration defines two main targets:
- `default`: Server functions with Node.js wrapper
- `middleware`: External middleware with Edge wrapper

**Overrides Available:**
- `wrapper`: cloudflare-node (server) or cloudflare-edge (middleware)
- `converter`: edge
- `proxyExternalRequest`: fetch
- `queue`: Custom queue handler
- `incrementalCache`: R2 or custom cache implementation
- `tagCache`: Durable Object-based tag cache

### 2. Custom Worker Entrypoints

#### Middleware Worker (`middleware.js`)
- Extends `WorkerEntrypoint` from `cloudflare:workers`
- Imports `runWithCloudflareRequestContext` for context management
- Uses `middlewareHandler` from `.open-next/middleware/handler.mjs`
- Exports Durable Object classes for queue and tag cache
- Sets version affinity header: `Cloudflare-Workers-Version-Overrides`

#### Server Worker (`server.js`)
- Standard Worker export
- Imports `runWithCloudflareRequestContext`
- Uses main handler from `.open-next/server-functions/default/handler.mjs`

### 3. Wrangler Configuration

#### Middleware Worker Configuration
```jsonc
{
  "main": "middleware.js",
  "name": "middleware",
  "compatibility_date": "2025-04-14",
  "compatibility_flags": [
    "nodejs_compat",
    "allow_importable_env",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": "../../.open-next/assets",
    "binding": "ASSETS"
  },
  "vars": {
    "WORKER_VERSION_ID": "TO_REPLACE" // Replaced on each deployment
  },
  "services": [
    {
      "binding": "DEFAULT_WORKER",
      "service": "main-server"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "name": "NEXT_TAG_CACHE_DO_SHARDED",
        "class_name": "DOShardedTagCache"
      },
      {
        "name": "NEXT_CACHE_DO_QUEUE",
        "class_name": "DOQueueHandler"
      }
    ]
  }
}
```

#### Server Worker Configuration
- References middleware worker's Durable Objects via `script_name`
- Uses `WORKER_SELF_REFERENCE` service binding pointing to middleware
- No routes defined (handled by middleware)

### 4. Deployment Strategy

The deployment uses Cloudflare's Gradual Deployments (Version Affinity) to ensure zero-downtime updates:

**Deployment Steps:**
1. Upload server worker version → Get `NEW_SERVER_VERSION_ID`
2. Update middleware wrangler config with new server version ID
3. Upload middleware worker version → Get `NEW_MIDDLEWARE_VERSION_ID`
4. Get current deployed server version (`CURRENT_SERVER_ID`)
5. Deploy server at 0% traffic: `CURRENT_SERVER_ID@100% NEW_SERVER_VERSION_ID@0%`
6. Deploy middleware at 100% traffic: `NEW_MIDDLEWARE_VERSION_ID@100%`
7. Deploy server at 100% traffic: `NEW_SERVER_VERSION_ID@100%`

**Version Affinity Mechanism:**
- Middleware sets `Cloudflare-Workers-Version-Overrides: server="VERSION_ID"` header
- This header routes requests to the correct server worker version
- Prevents version mismatches during gradual rollouts

## Limitations

**This advanced setup CANNOT be used with:**
- Preview URLs (staging deployments)
- Skew protection features
- Standard `@opennextjs/cloudflare deploy` command

**Requirements:**
- Manual deployment via wrangler CLI
- Version ID management
- Gradual deployment orchestration

## GitBook Implementation Analysis

### GitBook's Custom Setup

GitBook uses three workers:
1. **DO Worker** - Durable Objects for queue and tag cache
2. **Default (Server) Worker** - Main server functions
3. **Middleware Worker** - Routing and middleware

### Configuration Highlights

**open-next.config.ts:**
- Separate overrides for `default` and `middleware` targets
- Custom implementations for queue, incremental cache, and tag cache
- Cache interception enabled
- Edge externals for `node:crypto`

**Build Process:**
```bash
bun run turbo build:cloudflare
```

**Deployment:**
1. Deploy DO worker (direct deploy)
2. Upload server version
3. Run `updateWrangler.ts` script to update version ID
4. Upload middleware version
5. Gradual deployment if deploying to production

### GitBook's CI/CD Pipeline

Uses GitHub Actions with:
- 1Password for secrets management
- Cloudflare/wrangler-action@v3.14.0
- Custom gradual deploy action
- Version extraction from wrangler output

## When to Use Multi-Worker

**Benefits:**
- Reduced memory footprint per worker
- Improved cold start performance
- Middleware served separately for ISR/SSG cache hits
- Better resource isolation

**Use Cases:**
- High-traffic applications
- Applications with heavy middleware logic
- Scenarios requiring optimized cold starts
- Complex routing requirements

## Technology Stack

**Core Dependencies:**
- `@opennextjs/cloudflare` - OpenNext Cloudflare adapter
- `wrangler` - Cloudflare Workers CLI (v4.43.0)
- `cloudflare:workers` - Worker runtime APIs

**Storage & Caching:**
- R2 - Incremental cache storage
- Durable Objects - Tag cache and queue
- Regional Cache - Performance optimization

**Build Tools:**
- OpenNext build process
- Custom wrangler configurations
- TypeScript for configuration scripts

## File Structure

```
project/
├── open-next.config.ts          # OpenNext configuration
├── middleware.js                # Middleware worker entrypoint
├── server.js                    # Server worker entrypoint
├── middleware-wrangler.jsonc    # Middleware worker config
├── server-wrangler.jsonc        # Server worker config
├── do-wrangler.jsonc           # Durable Objects worker config
├── .open-next/                 # Build output
│   ├── assets/                 # Static assets
│   ├── cloudflare/init.js      # Cloudflare initialization
│   ├── middleware/handler.mjs  # Built middleware handler
│   └── server-functions/       # Built server functions
└── scripts/
    └── updateWrangler.ts       # Deployment script
```

## References

1. [OpenNext Multi-Worker Documentation](https://opennext.js.org/cloudflare/howtos/multi-worker)
2. [GitBook Implementation](https://github.com/GitbookIO/gitbook/blob/main/packages/gitbook/open-next.config.ts)
3. [GitBook Deployment Action](https://github.com/GitbookIO/gitbook/blob/main/.github/composite/deploy-cloudflare/action.yaml)
4. [Cloudflare Gradual Deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)
5. [Cloudflare Version Affinity](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/#version-affinity)
