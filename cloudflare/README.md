# Cobalt on Cloudflare Workers

## Architecture

- **cobalt-web** — SvelteKit static UI + `/api/*` proxy to `cobalt-api`
- **cobalt-api** — Container Durable Object running the Express API (`Dockerfile`)

Public URL: `https://cobalt-web.lazee.workers.dev` (Cloudflare Access protected).

The API worker's `workers.dev` subdomain is disabled; only the web worker service binding can reach it.

## Deploy

```bash
# API container worker
cd cloudflare/api && pnpm run deploy

# Web UI + proxy
cd web
WEB_DEFAULT_API="https://cobalt-web.lazee.workers.dev/api/" pnpm run build
wrangler deploy
```

## Cloudflare Access

```bash
doppler run --project quickapp --config dev -- \
  node cloudflare/scripts/enable-access.mjs
```

Requires `CLOUDFLARE_EMAIL` + `CLOUDFLARE_API_KEY` (Global API Key with Access permissions).

Creates an Access app for `cobalt-web.lazee.workers.dev`, enables `access_protected` on the
workers.dev route, and provisions a service token for `sidebar-api` machine-to-machine calls.

## Extension integration

The Brave **ai-dev-sidebar** extension imports online videos via `sidebar-api`
`POST /api/videos/import`, which calls Cobalt with the Access service token and stores
results in the `sidebar-blobs` R2 bucket.
