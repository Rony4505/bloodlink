# BloodLink + Smart craft corner — Online deploy guide

Donor data must live in **Railway Postgres**. Fashion store data lives on the **Railway Volume** at `/app/data` (`fashion-store.json` + uploads).

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

Also keep a Volume on the **bloodlink** service:

- Mount path: `/app/data`

Postgres is the source of truth for donors; the volume keeps fashion store JSON, OTP files, and product image uploads across redeploys.

**Important:** After every redeploy check `https://bloodlinkbd.org/api/health`

- `"backend": "postgres"`
- `"donorCount"` must not drop to `0`

Fashion store admin: `https://YOUR-DOMAIN/store-admin`  
Default login (change in Railway Variables): username `founder`, password from `FASHION_ADMIN_PASSWORD`

If donors were lost and you still have an old `bloodlink.json` backup, ask an admin to restore it via `POST /api/admin/restore`.

### Other env vars

- `AUTH_SECRET` = long random string (32+ chars)
- `ADMIN_USERNAME` = your admin username
- `ADMIN_PASSWORD` = strong password
- `FASHION_ADMIN_USERNAME` = fashion store admin (default `founder`)
- `FASHION_ADMIN_PASSWORD` = fashion store admin password
- `DATA_DIR` = `/app/data` (Railway volume mount)
- `NEXT_PUBLIC_SITE_URL` = `https://bloodlinkbd.org`

Owner panel: `https://YOUR-DOMAIN/owner-hq-7f3m`

## Local development

Without `DATABASE_URL`, the app uses `data/bloodlink.json` on disk.  
Fashion store uses `data/fashion-store.json` (or `$DATA_DIR/fashion-store.json`).

## Before going public

- Change admin password
- Set a strong `AUTH_SECRET`
- Confirm `/api/health` shows `"backend": "postgres"`
- Confirm `/store-admin` login works
- Test register → redeploy → donor still exists
- Test add product image → redeploy → image still loads
