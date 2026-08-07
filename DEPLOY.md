# BloodLink — Online deploy guide

BloodLink currently stores data in a local `data/bloodlink.json` file.
Use a host that keeps that file (Railway / Render / VPS). Pure Vercel serverless can reset data.

## Recommended: Railway (easy + persistent disk)

1. Create account: https://railway.app
2. Install Git, push this project to GitHub
3. Railway → New Project → Deploy from GitHub repo `bloodlink`
4. Add a volume mounted at `/app/data` (or project `data` folder)
5. Set environment variables:
   - `AUTH_SECRET` = long random string (32+ chars)
   - `ADMIN_USERNAME` = your admin username
   - `ADMIN_PASSWORD` = strong password
6. Start command: `npm run start`
7. Build command: `npm run build`
8. Generate public domain in Railway settings

Owner panel (private): `https://YOUR-DOMAIN/owner-hq-7f3m`

## Alternative: Render

1. https://render.com → New Web Service → connect GitHub repo
2. Build: `npm install && npm run build`
3. Start: `npm run start`
4. Add a persistent disk at `/opt/render/project/src/data`
5. Same env vars as above

## Before going public

- Change admin password
- Set a new strong `AUTH_SECRET`
- Test register / search / blood request / admin login
