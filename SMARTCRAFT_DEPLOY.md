# Smart craft corner — separate from BloodLink

BloodLink stays on **https://bloodlinkbd.org** (`APP_MODE=bloodlink`).  
Smart craft corner is a **second Railway service** with its own domain.

## Target link

Use this domain name:

**https://smartcraftcorner.com**

(or `www.smartcraftcorner.com`)

## Railway: create the Smart craft service

1. Open https://railway.app → your project (or a new project)
2. **+ Create** → **GitHub Repo** → select `bloodlink` (same repo is OK)
3. Name the service: `smart-craft-corner`
4. Service **Variables**:

```text
APP_MODE=fashion
NEXT_PUBLIC_APP_MODE=fashion
NEXT_PUBLIC_SITE_URL=https://smartcraftcorner.com
FASHION_ADMIN_USERNAME=founder
FASHION_ADMIN_PASSWORD=rony4505
AUTH_SECRET=<long-random-secret>
DATA_DIR=/app/data
```

5. Add a **Volume** on this service → mount path `/app/data`
6. **Settings → Networking → Custom Domain** → add:
   - `smartcraftcorner.com`
   - `www.smartcraftcorner.com`
7. In your domain DNS (Namecheap / Cloudflare / etc.) add the records Railway shows
8. Deploy / Redeploy

## BloodLink service (existing)

Keep / set on the **bloodlink** service only:

```text
APP_MODE=bloodlink
NEXT_PUBLIC_APP_MODE=bloodlink
NEXT_PUBLIC_SITE_URL=https://bloodlinkbd.org
```

Do **not** put fashion env vars as the site mode on BloodLink.

## Admin

- Store: https://smartcraftcorner.com/store-admin
- Username: `founder`
- Password: `rony4505` (or your `FASHION_ADMIN_PASSWORD`)

## Check

- https://bloodlinkbd.org → BloodLink only (`/shop` must 404)
- https://smartcraftcorner.com → Smart craft corner home
- https://smartcraftcorner.com/find → 404 (no BloodLink pages)
