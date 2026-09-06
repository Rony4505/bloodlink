#!/usr/bin/env node
/** Quick checklist before building the Play Store AAB. */
const site = process.env.SITE_URL || "https://bloodlinkbd.org";

async function check(path) {
  const url = `${site.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    console.log(`${res.status} ${path} (${text.length} bytes)`);
    return res.ok;
  } catch (err) {
    console.log(`FAIL ${path}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

const paths = [
  "/",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/.well-known/assetlinks.json",
  "/privacy",
];

let ok = true;
for (const p of paths) {
  // eslint-disable-next-line no-await-in-loop
  if (!(await check(p))) ok = false;
}
process.exit(ok ? 0 : 1);
