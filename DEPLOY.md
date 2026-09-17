# BloodLink BD — Online deploy guide

| Site | URL |
|------|-----|
| BloodLink BD | https://bloodlinkbd.org |

Donor data must live in **Railway Postgres** (BloodLink service).

## BloodLink Railway setup

1. Open your BloodLink project on https://railway.app
2. Ensure Postgres is linked and `DATABASE_URL` is set
3. Set on the **bloodlink** service:
   - `NEXT_PUBLIC_SITE_URL=https://bloodlinkbd.org`
4. Volume mount path: `/app/data`
5. Redeploy and check `https://bloodlinkbd.org/api/health`

### Daily 10:00 AM (BD) notifications

BloodLink’s Railway **web service** runs an in-app scheduler (every 5 minutes) that
creates the daily donation reminder after the hour set in Admin → Notifications
(default **10:00 BD**). No separate Railway Cron Job is required.

Backup: GitHub Action `.github/workflows/bloodlink-daily-cron.yml` pings
`/api/cron/notifications` at **04:05 UTC** (~10:05 AM BD).

Optional: set `CRON_SECRET` on Railway + as a GitHub Actions secret, then the
cron URL requires `Authorization: Bearer …`.

### Other env vars

- `AUTH_SECRET` = long random string (32+ chars)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `DATA_DIR=/app/data`

Owner panel: `https://bloodlinkbd.org/admin`

## Local development

```bash
npm run dev
```
