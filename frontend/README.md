# Frontend

## Launch Page Proxy (`/launch`)

This frontend proxies `/launch` to a local EJS service in `frontend/launch-ejs`.

### Local Development

1. Install dependencies for the launch service:
   `npm --prefix frontend/launch-ejs install`
2. Start the launch EJS service:
   `npm --prefix frontend/launch-ejs run dev`
3. Start Next.js with the launch proxy origin:
   PowerShell: `$env:LAUNCH_EJS_ORIGIN='http://localhost:3001'; npm --prefix frontend run dev`
   Bash: `LAUNCH_EJS_ORIGIN=http://localhost:3001 npm --prefix frontend run dev`

### Environment Variable

- `LAUNCH_EJS_ORIGIN`
  - Default: `http://127.0.0.1:3001`
  - Used by `frontend/next.config.mjs` rewrites for:
    - `/launch`
    - `/launch-assets/:path*`

### Docker Compose

`docker-compose.yml` runs `launch-ejs` and injects:

- `LAUNCH_EJS_ORIGIN=http://launch-ejs:3001` into `frontend`

### Failure Behavior

If the `launch-ejs` service is down, `/launch` and `/launch-assets/*` will fail through proxy, while other Next routes continue to work.
