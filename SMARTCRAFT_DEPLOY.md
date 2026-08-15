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

5. Add a **Volume** on this service → mount path **`/app/data`** (required — without this, products/orders/settings reset on every redeploy)
6. **Settings → Networking → Custom Domain** → add:
   - `smartcraftcorner.com`
   - `www.smartcraftcorner.com`
7. After first deploy, open **`/api/health`** — `storage.mainExists` should be `true` and `storage.productCount` should match your catalog
8. In your domain DNS (Namecheap / Cloudflare / etc.) add the records Railway shows
9. Deploy / Redeploy

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

## Important: which GitHub repo is connected?

Railway Smart craft service must deploy from **`Rony4505/bloodlink`** (where UX updates are merged).

If your service still points at **`Rony4505/smart-craft-corner`**, that repo is an old snapshot — live will not show new changes until you either:

### Option A — Switch Railway to bloodlink (recommended)

1. Railway → Smart craft service → **Settings → Source**
2. Connect repo **`Rony4505/bloodlink`**, branch **`main`**
3. **Settings → Build** → Dockerfile Path = **`Dockerfile.fashion`**
   (or Config-as-code = **`railway.smartcraft.toml`**)
4. **Deployments → Redeploy**

### Option B — Update smart-craft-corner repo from bloodlink

On your computer (logged into GitHub):

```bash
git clone https://github.com/Rony4505/bloodlink.git
cd bloodlink
git push https://github.com/Rony4505/smart-craft-corner.git main:main
```

Then Railway → **Redeploy** (Dockerfile path can stay `Dockerfile` in that repo).

## Redeploy after code changes

Smart craft is a **separate Railway service** from BloodLink. Pushing to GitHub updates BloodLink automatically only if that service is connected; **Smart craft must be redeployed manually** unless its service also has GitHub auto-deploy on `main`.

1. Railway → project → **smart-craft-corner** (or your fashion service name)
2. **Settings → Build** → Dockerfile Path = `Dockerfile.fashion`
3. **Deployments** → **Redeploy** (latest commit on `main`)
4. Verify: `https://smartcraftcorner.up.railway.app/api/health` should show `"appMode":"fashion"` and a recent `buildId`

