# bloodlinkbd.org + Google setup

## A) Connect domain on Railway

1. Buy `bloodlinkbd.org` (Namecheap / GoDaddy / Spaceship / Cloudflare Registrar)
2. Railway project → **Settings → Networking → Custom Domain**
3. Add:
   - `bloodlinkbd.org`
   - `www.bloodlinkbd.org`
4. Railway will show DNS records. In your domain DNS panel add them, usually:
   - `CNAME` for `www` → Railway target
   - `@` / root as Railway instructs (CNAME flattening or ALIAS/A record)
5. Wait for SSL to become active (can take a few minutes to a few hours)

Also add Railway variable on the **bloodlink** service:

```text
NEXT_PUBLIC_SITE_URL=https://bloodlinkbd.org
```

Important:
- Name must be exact: `NEXT_PUBLIC_SITE_URL` (no spaces)
- After saving, open **Deployments → Redeploy** (full rebuild)
- Confirm at `https://bloodlinkbd.org/robots.txt` that Host/Sitemap show `.org`


## B) Show site on Google

Google-এ সাথে সাথে আসবে না। সাধারণত কয়েক দিন লাগে।

1. Open [Google Search Console](https://search.google.com/search-console)
2. **Add property** → **URL prefix** → `https://bloodlinkbd.org`
3. Verify ownership — easiest: **DNS record** (TXT) in Namecheap Advanced DNS
4. After verified:
   - Left menu → **Sitemaps** → submit `https://bloodlinkbd.org/sitemap.xml`
   - **URL Inspection** → `https://bloodlinkbd.org` → **Request indexing**
   - Also request `/find`, `/requests`, `/about`

Optional: also add a **Domain** property for `bloodlinkbd.org` (covers http/https and www).

Helpful links after go-live:

- `https://bloodlinkbd.org/robots.txt`
- `https://bloodlinkbd.org/sitemap.xml`
