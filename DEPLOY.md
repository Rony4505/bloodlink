# BloodLink — Online deploy guide

**Important:** Donor data must live in **Railway Postgres**.  
If the website uses file storage only, **editing or redeploying the site erases all users**.

## Fix “users disappear when I edit the website”

This happens when `/api/health` shows:

```json
"backend": "file",
"durable": false
```

Do this once on Railway:

1. Open https://railway.app → your BloodLink project
2. Click **`+ Create`** → **Database** → **PostgreSQL**
3. Open the **bloodlink** web service → **Variables**
4. **Add Variable** → **Add Reference** → select the Postgres `DATABASE_URL`  
   (it must be on the **bloodlink** service itself, not only Shared Variables)
5. Click **Deploy** on bloodlink
6. Open `https://YOUR-DOMAIN/api/health`
   - Must show `"backend": "postgres"` and `"durable": true`
7. Register a test donor, note `donorCount`, then redeploy once  
   - `donorCount` must stay the same

Optional backup: attach a Railway **Volume** mounted at `/app/data`.  
Postgres is still the recommended source of truth.

### Other env vars

- `AUTH_SECRET` = long random string (32+ chars)
- `ADMIN_USERNAME` = your admin username
- `ADMIN_PASSWORD` = strong password
- `DATABASE_URL` = from Railway Postgres (required in production)

Owner panel: `https://YOUR-DOMAIN/owner-hq-7f3m`

## Local development

Without `DATABASE_URL`, the app uses `data/bloodlink.json` on disk.

## Before going public

- Change admin password
- Set a strong `AUTH_SECRET`
- Confirm `/api/health` shows `"backend": "postgres"` and `"durable": true`
- Test register → redeploy → donor still exists
