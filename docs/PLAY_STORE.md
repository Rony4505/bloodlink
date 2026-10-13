# BloodLink BD — Google Play Store (Android app)

এই সাইট এখন **PWA + Trusted Web Activity (TWA)** হিসেবে Play Store-এ দেওয়ার জন্য ready।  
**ডেটাবেজ মুছে ফেলা হয়নি** — শুধু অ্যাপ প্যাকেজিং লেয়ার যোগ হয়েছে।

## কী কী যোগ হয়েছে

| Item | Path |
|------|------|
| Web App Manifest | `/manifest.webmanifest` (`src/app/manifest.ts`) |
| Service Worker | `/sw.js` (push + light offline shell) |
| App icons 192/512 (+ maskable) | `/public/icons/` |
| Digital Asset Links API | `/.well-known/assetlinks.json` |
| Bubblewrap TWA config | `twa/twa-manifest.json` |

Package name: **`org.bloodlinkbd.android`**  
Website: **`https://bloodlinkbd.org`**

> Note: Older docs used `org.bloodlinkbd.app`. That package is reserved on Play; new listings use `org.bloodlinkbd.android`.

---

## Play Store-এ আপলোড — ধাপ

### ১) Railway-এ env (deploy-এর পর)

Play App Signing এর SHA-256 fingerprint বসান (colon সহ):

```bash
TWA_PACKAGE_NAME=org.bloodlinkbd.android
TWA_SHA256_CERT_FINGERPRINTS=AB:CD:EF:...
```

Fingerprint পাবেন:
- Play Console → Your app → Setup → App signing → **App signing key certificate** → SHA-256
- Upload key আলাদা হলে সেটাও কমা দিয়ে একসাথে দিন

Verify:
`https://bloodlinkbd.org/.well-known/assetlinks.json`  
খালি `[]` না হয়ে package + fingerprint দেখাবে।

### ২) সহজ পথ — PWABuilder (সুপারিশ)

1. https://www.pwabuilder.com খুলুন  
2. URL দিন: `https://bloodlinkbd.org`  
3. **Package for stores** → Android  
4. Package ID: `org.bloodlinkbd.android`  
5. **App version** / version name: `1.0.1` (বা পরের নম্বর)  
6. **Version code**: আগের আপলোডের চেয়ে **বড়** সংখ্যা দিন (এখন `2`; পরেরবার `3`, `4`…) — একই version code দুবার আপলোড হয় না  
7. AAB ডাউনলোড করুন  
8. [Google Play Console](https://play.google.com/console) → Testing → Upload AAB  

### ৩) Alternate — Bubblewrap (CLI)

Need: Node.js, JDK 17, Android SDK cmdline tools.

```bash
npm i -g @bubblewrap/cli
cd twa
bubblewrap build --manifest=./twa-manifest.json
```

Generated `app-release-bundle.aab` Play Console-এ আপলোড করুন।

---

## Play Console listing (বাংলা/ইংরেজি)

- **App name:** BloodLink BD  
- **Short description:** Bangladesh blood donor finder — urgent help, faster.  
- **Privacy policy URL:** `https://bloodlinkbd.org/privacy`  
- **Category:** Medical / Health  
- **Contact:** আপনার সাপোর্ট ইমেইল  
- Screenshots: ফোন থেকে Chrome-এ সাইট খুলে 2–8টা স্ক্রিনশট  

---

## Data safety

- Apps ready = website wrap (TWA). **Donor/volunteer data wipe হয় না।**  
- VAPID / push keys পরিবর্তন করবেন না।  
- নতুন native backend লাগে না — একই `bloodlinkbd.org` চলবে।

---

## Publish এর পর চেকলিস্ট

1. Live: `/manifest.webmanifest` + `/sw.js` 200  
2. `/.well-known/assetlinks.json` এ fingerprint আছে  
3. Android ফোনে Play থেকে ইনস্টল → অ্যাপ আইকন খুলে সাইট fullscreen  
4. Notification Allow → push আসে  
5. Login / volunteer work URL কাজ করে  

প্রশ্ন থাকলে Play Console-এ Internal testing track আগে ব্যবহার করুন, তারপর Production।
