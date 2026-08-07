# bloodlinkbd.com + Google setup

## A) Connect domain on Railway

1. Buy `bloodlinkbd.com` (Namecheap / GoDaddy / Spaceship / Cloudflare Registrar)
2. Railway project → **Settings → Networking → Custom Domain**
3. Add:
   - `bloodlinkbd.com`
   - `www.bloodlinkbd.com`
4. Railway will show DNS records. In your domain DNS panel add them, usually:
   - `CNAME` for `www` → Railway target
   - `@` / root as Railway instructs (CNAME flattening or ALIAS/A record)
5. Wait for SSL to become active (can take a few minutes to a few hours)

Also add Railway variable:

```text
NEXT_PUBLIC_SITE_URL=https://bloodlinkbd.com
```

Then redeploy.

## B) Show site on Google

Google-এ সাথে সাথে আসবে না। সাধারণত কয়েক দিন লাগে।

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property → URL prefix → `https://bloodlinkbd.com`
3. Verify ownership (DNS TXT record is easiest)
4. After verified:
   - Sitemaps → submit `https://bloodlinkbd.com/sitemap.xml`
   - URL Inspection → `https://bloodlinkbd.com` → Request indexing
   - Also request `/find`, `/requests`, `/about`

Helpful links after go-live:

- `https://bloodlinkbd.com/robots.txt`
- `https://bloodlinkbd.com/sitemap.xml`
