# Volunteer training PDFs

Downloadable from the website (after deploy):

1. [/volunteer-guides/01-bloodlink-volunteer-guide.pdf](/volunteer-guides/01-bloodlink-volunteer-guide.pdf) — BloodLink কাজ + ইউজারকে বোঝানো (স্ক্রিনশটসহ)
2. [/volunteer-guides/02-healthcare-hospital-guide.pdf](/volunteer-guides/02-healthcare-hospital-guide.pdf) — স্বাস্থ্যসেবা + হাসপাতাল কর্তৃপক্ষকে বোঝানো (স্ক্রিনশটসহ)

HTML versions (same folder):

- `/volunteer-guides/01-bloodlink-volunteer-guide.html`
- `/volunteer-guides/02-healthcare-hospital-guide.html`

Regenerate:

```bash
# BloodLink must be running on :3000
node scripts/build-volunteer-guide-pdfs.mjs
```
