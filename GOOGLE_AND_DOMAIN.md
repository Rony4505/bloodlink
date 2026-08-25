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


## C) Google Search-এ logo / link icon আপডেট হচ্ছে না?

**এটা স্বাভাবিক।** Google Search result-এর ছোট্ট logo (favicon) সাথে সাথে বদলায় না — সাধারণত কয়েক দিন থেকে কয়েক সপ্তাহ লাগে।

### গুরুত্বপূর্ণ পার্থক্য

| কোথায় | কোন ফাইল |
| --- | --- |
| Website header / homepage logo | Admin panel → Site appearance → Logo upload (`logoUrl`) |
| Google Search-এর পাশের ছোট icon | `favicon.ico`, `icon-48.png`, `icon-192.png` |

Admin থেকে logo বদলালে **শুধু সাইটে** দেখা যায়। Google-এর icon আলাদা — সেই static favicon ফাইলগুলো আপডেট করতে হয়।

### এখনই যা করবেন

1. নতুন logo যদি চান Google-এ:
   - Square PNG বানান (কমপক্ষে **48×48**, ভালো হয় **192×192**)
   - `public/icon-48.png`, `public/icon-192.png`, `public/apple-touch-icon.png` replace করুন
   - চাইলে `public/favicon.ico` ও update করুন
   - Deploy / Redeploy Railway
2. Browser-এ খুলে check করুন:
   - `https://bloodlinkbd.org/icon-192.png`
   - `https://bloodlinkbd.org/favicon.ico`
3. [Google Search Console](https://search.google.com/search-console) → **URL Inspection**
   - `https://bloodlinkbd.org` পেস্ট করুন
   - **Request indexing** চাপুন (homepage আবার crawl করতে বলে)
4. অপেক্ষা করুন — Google cache refresh হতে **কয়েক দিন–কয়েক সপ্তাহ** লাগতে পারে
5. নিজের browser cache clear করেও Google result একই থাকতে পারে; সেটা Google-এর cache

### করবেন না

- Favicon URL বারবার বদলাবেন না (Google unstable URL পছন্দ করে না)
- প্রতি ঘন্টায় Request indexing spam করবেন না
- শুধু admin logo upload করে Google icon expect করবেন না

### Check list

- [ ] `icon-192.png` square এবং নতুন logo দেখাচ্ছে
- [ ] Homepage HTML-এ `<link rel="icon" ...>` আছে (view source)
- [ ] Search Console property verified (`https://bloodlinkbd.org`)
- [ ] Homepage-এ Request indexing করা হয়েছে
- [ ] Redeploy এর পর live URL-এ নতুন icon খুলছে
