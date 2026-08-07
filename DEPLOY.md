# BloodLink — Online deploy guide

Donor data must live in **Railway Postgres**. File/volume storage alone can reset when the website redeploys.

## Railway setup (required for permanent data)

1. Open your BloodLink project on https://railway.app
2. On the canvas click **`+ Create`**
3. Choose **Database** → **PostgreSQL**
4. After Postgres appears, open the **bloodlink** web service → **Variables**
5. Click **Add variable** → **Add reference** (or connect database)
   - Make sure `DATABASE_URL` is present on the **bloodlink** service
   - Railway usually adds it automatically when you link Postgres
6. Redeploy the **bloodlink** service
7. Open `https://YOUR-DOMAIN/api/health`
   - `"backend": "postgres"` must appear
   - Then register a donor and note `donorCount`
   - Redeploy again — `donorCount` should stay the same

Optional: keep the volume at `/app/data` as a backup, but **Postgres is what keeps data safe**.

### Other env vars

- `AUTH_SECRET` = long random string (32+ chars)
- `ADMIN_USERNAME` = your admin username
- `ADMIN_PASSWORD` = strong password

Owner panel: `https://YOUR-DOMAIN/owner-hq-7f3m`

## Local development

Without `DATABASE_URL`, the app uses `data/bloodlink.json` on disk.

## Before going public

- Change admin password
- Set a strong `AUTH_SECRET`
- Confirm `/api/health` shows `"backend": "postgres"`
- Test register → redeploy → donor still exists
