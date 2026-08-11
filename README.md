# Smart craft corner

Luxury womenswear ecommerce for Bangladesh.

**Live:** https://smartcraftcorner.up.railway.app

## Admin
- URL: `/store-admin`
- Username: `founder`
- Password: set `FASHION_ADMIN_PASSWORD` (default `rony4505`)

## Local

```bash
npm install
APP_MODE=fashion NEXT_PUBLIC_APP_MODE=fashion npm run dev
```

## Railway

Set:
- `APP_MODE=fashion`
- `NEXT_PUBLIC_APP_MODE=fashion`
- `NEXT_PUBLIC_SITE_URL=https://smartcraftcorner.up.railway.app`
- `FASHION_ADMIN_PASSWORD=...`
- Volume mount: `/app/data`

This repo is separate from BloodLink BD (`bloodlinkbd.org`).
