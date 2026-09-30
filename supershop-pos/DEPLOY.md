# Deploy LOOM POS on Railway

## One-time setup

1. Open https://railway.app → project **carefree-eagerness** (or create a new project)
2. **+ Create** → **GitHub Repo** → `Rony4505/bloodlink`
3. After the service appears, open **Settings**:
   - **Root Directory** = `supershop-pos`
   - **Builder** = Dockerfile (uses `supershop-pos/Dockerfile`)
4. **Variables** → add:
   - `AUTH_SECRET` = long random string (32+ chars)
5. **Networking** → **Generate Domain** (port `8080`)
6. Wait for deploy → open the `*.up.railway.app` URL

## Login

- Demo PIN: `1234`
- Change PIN later in **Settings** inside the app

## Optional volume (keeps sales/products across redeploys)

Settings → Volumes → mount path `/app/data`
