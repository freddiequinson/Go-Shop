# Frontend

## Launch Page (`/launch`)

This frontend serves `/launch` directly from Next.js runtime by rendering templates from `frontend/launch-ejs/views` and assets from `frontend/launch-ejs/public`.

### Local Development

Run a single command:
`npm --prefix frontend run dev`

### Docker Compose

No separate launch service is required. The Next.js container serves both:
- `/launch`
- `/launch-assets/:path*`

### Failure Behavior

If launch template/asset files are missing under `frontend/launch-ejs`, `/launch` or `/launch-assets/*` may fail.
