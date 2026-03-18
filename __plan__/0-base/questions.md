# OpenNext Multi-Worker Project - Clarifying Questions

## Core Decisions

### 1. Project Complexity Level

**Options:**

- **Simpler approach**: Two workers (middleware + server) with built-in OpenNext overrides
- **Advanced approach**: Three+ workers like GitBook (adds separate DO worker, custom cache implementations)

JAK > Project must have a middleware that serves as the face of the application and routes to the appropriate content worker. The content workers will serve up the Next content, either dynamic or static. Assume at least two content workers, routing by path. The middleware worker is responsible for making RPC calls to the downstream workers.

There is a need for at least one additional Worker + Durable Object to manage deployments. Deployment is the most challenging aspect as we need to (1) create a custom path and (2) keep worker versions consistent.

### 2. Sample Application Type

What should the demo app do? Examples:

- [ ] Blog with ISR/SSG pages
- [ ] Dashboard with API routes and middleware auth
- [ ] E-commerce with caching and revalidation
- [x] Simple feature showcase (middleware, API, SSR, SSG)
- [ ] Other: ******\_\_\_******

JAK > Good idea. Let's have a content worker each for API, SSR, and SSG. The scenario can be an eCommerce site as this is a pattern that often utilizes that mix of strategies.

### 3. Caching Strategy

**Select components to include:**

- [x] R2 for incremental cache (simplest)
- [ ] Regional cache for performance (more complex)
- [ ] Tag cache with Durable Objects (required for on-demand revalidation)
- [ ] Queue for background revalidation

### 4. Deployment Automation

**Preferred approach:**

- [x] Local deployment instructions only (manual wrangler commands)
- [ ] GitHub Actions workflow included
- [ ] Simplified deployment (skip gradual deployment complexity)
- [x] Full gradual deployment with version affinity

### 5. Documentation Scope

**What to include:**

- [x] README with setup instructions
- [x] Architecture diagrams
- [x] Step-by-step build guide
- [x] Deployment guide
- [x] Troubleshooting section

### 6. Technology Preferences

- **Package manager:** pnpm
- **TypeScript strictness:** strict
- **Specific Next.js features to showcase:** ******\_\_\_******

## Recommendations

For an understandable sample project, I recommend:

- Two-worker approach (middleware + server)
- Blog or dashboard demo with ISR/SSG
- R2 caching without regional cache initially
- Manual deployment instructions with optional GitHub Actions
- Comprehensive README with architecture overview

Once you respond to these questions, I'll create a detailed implementation plan with todos.

JAK > See responses.
