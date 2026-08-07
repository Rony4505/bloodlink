# BloodLink — Online deploy guide

BloodLink stores data in `bloodlink.json` on disk (`DATA_DIR`, default `/app/data` in Docker).
Website code deploys must **never** wipe that folder — only a Railway **Volume** keeps it safe.

## Recommended: Railway (Docker + Volume)

1. Create account: https://railway.app
2. Push this project to GitHub, then Railway → New Project → Deploy from GitHub `bloodlink`
3. **Add a Volume** (required or every deploy can lose donors):
   - Create → **Volume**
   - Attach to the `bloodlink` service
   - Mount path must be exactly: `/app/data`
   - Do **not** delete or recreate this volume later
4. Set environment variables:
   - `AUTH_SECRET` = long random string (32+ chars)
   - `ADMIN_USERNAME` = your admin username
   - `ADMIN_PASSWORD` = strong password
   - `DATA_DIR` = `/app/data` (optional; already set in Docker)
5. Deploy, then open: `https://YOUR-DOMAIN/api/health`
   - `storage.dbPath` should be `/app/data/bloodlink.json`
   - `storage.donorCount` should stay the same after later deploys
6. Owner panel: `https://YOUR-DOMAIN/owner-hq-7f3m`

### If donors disappear after a deploy

1. Confirm the volume still exists and mount path is `/app/data`
2. Open `/api/health` — if `donorCount` is `0` and volume is new/empty, old data cannot be recovered
3. Never remove the volume when changing website code — only redeploy the service

## Alternative: Render

1. https://render.com → New Web Service → connect GitHub repo
2. Build: `npm install && npm run build`
3. Start: `npm run start`
4. Add a persistent disk at the same path as `DATA_DIR` (e.g. `/app/data`)
5. Same env vars as above

## Before going public

- Change admin password
- Set a new strong `AUTH_SECRET`
- Test register / search / blood request / admin login
- Confirm `/api/health` after a test redeploy still shows the same `donorCount`
