/**
 * Capture volunteer training screenshots and build 2 Bangla PDF guides.
 * Run: node scripts/build-volunteer-guide-pdfs.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile, copyFile } from "fs/promises";
import path from "path";

const BASE = process.env.GUIDE_BASE_URL || "http://localhost:3000";
const OUT = path.join(process.cwd(), "public", "volunteer-guides");
const SHOTS = path.join(OUT, "screenshots");
const ARTIFACTS = "/opt/cursor/artifacts";

async function shot(page, name, url, opts = {}) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(opts.wait || 800);
  if (opts.localeBn) {
    // Try switch to Bangla if a language toggle exists
    const toggle = page.locator('button:has-text("বাংলা"), button:has-text("BN"), button:has-text("EN")').first();
    if (await toggle.count()) {
      const text = await toggle.innerText().catch(() => "");
      if (/EN|English/i.test(text) || text.includes("EN")) {
        await toggle.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }
  }
  if (opts.click) {
    await page.locator(opts.click).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
  }
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: Boolean(opts.fullPage) });
  console.log("shot", name);
  return file;
}

function imgTag(name, caption) {
  return `
  <figure class="shot">
    <img src="screenshots/${name}.png" alt="${caption}" />
    <figcaption>${caption}</figcaption>
  </figure>`;
}

function wrapHtml(title, subtitle, body) {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @font-face {
      font-family: "NotoSansBengali";
      src: url("/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf") format("truetype");
      font-weight: 400;
    }
    @font-face {
      font-family: "NotoSansBengali";
      src: url("/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf") format("truetype");
      font-weight: 700;
    }
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "NotoSansBengali", "Noto Sans Bengali", system-ui, sans-serif;
      color: #1f1a17;
      line-height: 1.55;
      font-size: 12.5px;
      margin: 0;
    }
    h1 {
      font-size: 22px;
      color: #6e1220;
      margin: 0 0 6px;
      line-height: 1.25;
    }
    h2 {
      font-size: 15px;
      color: #6e1220;
      border-bottom: 2px solid #f0d7d2;
      padding-bottom: 4px;
      margin: 22px 0 8px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13px;
      margin: 14px 0 6px;
      color: #3a221c;
      page-break-after: avoid;
    }
    p, li { margin: 0 0 8px; }
    .sub { color: #5c4a44; margin-bottom: 14px; }
    .badge {
      display: inline-block;
      background: #6e1220;
      color: #fff;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .card {
      background: #fff8f4;
      border: 1px solid #ead8d1;
      border-radius: 12px;
      padding: 12px 14px;
      margin: 10px 0 14px;
      page-break-inside: avoid;
    }
    .say {
      background: #f4fff8;
      border-left: 4px solid #2f6b4f;
      padding: 10px 12px;
      margin: 8px 0 12px;
      border-radius: 0 10px 10px 0;
      page-break-inside: avoid;
    }
    .say strong { color: #2f6b4f; }
    ol.steps { padding-left: 18px; }
    ol.steps li { margin-bottom: 10px; }
    figure.shot {
      margin: 10px 0 16px;
      page-break-inside: avoid;
      border: 1px solid #e6d7d0;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
    }
    figure.shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    figcaption {
      font-size: 11px;
      color: #6a564e;
      padding: 7px 10px;
      background: #faf4f0;
      border-top: 1px solid #eadfd8;
    }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #7a6660;
      border-top: 1px solid #ead8d1;
      padding-top: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 12px; }
    th, td { border: 1px solid #e5d6cf; padding: 7px 8px; text-align: left; vertical-align: top; }
    th { background: #fff1ec; color: #6e1220; }
  </style>
</head>
<body>
  <div class="badge">BloodLink BD · Volunteer Guide</div>
  <h1>${title}</h1>
  <p class="sub">${subtitle}</p>
  ${body}
  <div class="footer">
    BloodLink BD — bloodlinkbd.org · এই গাইড শুধুমাত্র ভলান্টিয়ার প্রশিক্ষণের জন্য।
  </div>
</body>
</html>`;
}

async function htmlToPdf(browser, htmlPath, pdfPath) {
  const page = await browser.newPage();
  const fileUrl = "file://" + htmlPath;
  await page.goto(fileUrl, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
  });
  await page.close();
  console.log("pdf", pdfPath);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(SHOTS, { recursive: true });
  await mkdir(ARTIFACTS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.25,
  });

  // Prefer Bangla UI where possible via cookie/localStorage if site uses it
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bloodlink_locale", "bn");
      localStorage.setItem("locale", "bn");
    } catch {}
  });

  await shot(page, "01-home", `${BASE}/`, { fullPage: true, localeBn: true });
  await shot(page, "02-find", `${BASE}/find`, { fullPage: true });
  await shot(page, "03-register", `${BASE}/register`, { fullPage: true });
  await shot(page, "04-requests", `${BASE}/requests`, { fullPage: true });
  await shot(page, "05-login", `${BASE}/login`, { fullPage: false });
  await shot(page, "06-about", `${BASE}/about`, { fullPage: true });
  await shot(page, "07-healthcare", `${BASE}/healthcare`, { fullPage: true });
  await shot(page, "08-healthcare-company", `${BASE}/healthcare/c/demo-city-hospital`, { fullPage: true });
  await shot(page, "09-hospital-portal", `${BASE}/healthcare/manage/demo-city-hospital`, { fullPage: true });
  // Doctors tab if buttons exist
  await shot(page, "10-hospital-doctors", `${BASE}/healthcare/manage/demo-city-hospital`, {
    fullPage: true,
    click: 'button:has-text("Doctors"), button:has-text("ডাক্তার")',
  });
  await shot(page, "11-hospital-appointments", `${BASE}/healthcare/manage/demo-city-hospital`, {
    fullPage: true,
    click: 'button:has-text("Appointments"), button:has-text("অ্যাপয়েন্টমেন্ট")',
  });

  const bloodBody = `
  <div class="card">
    <strong>এই গাইড কাকে?</strong> BloodLink ভলান্টিয়ারদের জন্য — যাতে সাধারণ ইউজার/ডোনারকে ওয়েবসাইটের কাজ সহজে বোঝাতে পারেন।
  </div>

  <h2>১. BloodLink কী?</h2>
  <p>BloodLink BD একটি রক্তদাতা খোঁজা, রক্তের প্রয়োজন পোস্ট করা এবং ডোনার ম্যানেজমেন্টের ওয়েবসাইট। লক্ষ্য: দ্রুত রক্তদাতা সংযোগ ও জীবন বাঁচানো।</p>
  ${imgTag("01-home", "হোমপেজ — এখান থেকেই ইউজারকে পরিচয় করিয়ে দিন")}

  <h2>২. মূল কাজগুলো (ইউজারকে যা দেখাবেন)</h2>
  <table>
    <tr><th>কাজ</th><th>পেজ</th><th>ইউজার কী পাবে</th></tr>
    <tr><td>ডোনার খোঁজা</td><td>/find</td><td>ব্লাড গ্রুপ, জেলা দিয়ে ডোনার খুঁজে ফোন করা</td></tr>
    <tr><td>ডোনার রেজিস্ট্রেশন</td><td>/register</td><td>নিজে ডোনার হয়ে প্রোফাইল তৈরি</td></tr>
    <tr><td>রক্তের প্রয়োজন পোস্ট</td><td>/requests</td><td>জরুরি রক্তের অনুরোধ দেখা/পোস্ট</td></tr>
    <tr><td>লগইন ও ড্যাশবোর্ড</td><td>/login</td><td>প্রোফাইল, ডোনেশন তারিখ, নোটিফিকেশন</td></tr>
    <tr><td>স্বাস্থ্য সেবা</td><td>/healthcare</td><td>হাসপাতাল খোঁজা ও অ্যাপয়েন্টমেন্ট</td></tr>
  </table>

  <h2>৩. ধাপে ধাপে ইউজারকে বোঝানোর স্ক্রিপ্ট</h2>

  <h3>A) ডোনার খুঁজতে চাইলে</h3>
  <div class="say"><strong>বলুন:</strong> “ব্লাড গ্রুপ ও এলাকা দিয়ে ডোনার খুঁজে সরাসরি কল করতে পারবেন।”</div>
  <ol class="steps">
    <li>হোম থেকে <strong>Find / খুঁজুন</strong> মেনু দেখান।</li>
    <li>ব্লাড গ্রুপ + জেলা সিলেক্ট করতে বলুন।</li>
    <li>ফলাফলে ফোন নম্বরে কল করতে দেখান।</li>
  </ol>
  ${imgTag("02-find", "ডোনার খোঁজার পেজ — ফিল্টার ও ফলাফল দেখান")}

  <h3>B) নিজে ডোনার হতে চাইলে</h3>
  <div class="say"><strong>বলুন:</strong> “একবার রেজিস্টার করলে জরুরি প্রয়োজনে নোটিফিকেশন পেতে পারেন।”</div>
  <ol class="steps">
    <li><strong>Register</strong> পেজ খুলুন।</li>
    <li>নাম, মোবাইল, ব্লাড গ্রুপ, জেলা সঠিকভাবে দিতে বলুন।</li>
    <li>OTP দিয়ে ভেরিফাই → Allow notifications (পারলে)।</li>
  </ol>
  ${imgTag("03-register", "রেজিস্ট্রেশন ফর্ম — ধাপগুলো একসাথে দেখান")}

  <h3>C) রক্তের প্রয়োজন পোস্ট</h3>
  <div class="say"><strong>বলুন:</strong> “হাসপাতাল/রোগীর জন্য জরুরি রক্তের অনুরোধ পোস্ট করতে পারবেন।”</div>
  ${imgTag("04-requests", "রক্তের প্রয়োজন / রিকোয়েস্ট পেজ")}

  <h3>D) লগইন ও নিজের প্রোফাইল</h3>
  <div class="say"><strong>বলুন:</strong> “লগইন করে শেষ রক্তদানের তারিখ আপডেট রাখলে সঠিকভাবে উপলব্ধ দেখাবে।”</div>
  ${imgTag("05-login", "ডোনার লগইন পেজ")}

  <h3>E) সাইট সম্পর্কে বিশ্বাস তৈরি</h3>
  ${imgTag("06-about", "About পেজ — বিশ্বাসযোগ্যতা বোঝাতে ব্যবহার করুন")}

  <h2>৪. ভলান্টিয়ারের নিজের কাজ (BloodLink অংশে)</h2>
  <ul>
    <li>প্রতি মাসে টার্গেট অনুযায়ী নতুন ডোনার রেজিস্টার/অ্যাড করা</li>
    <li>ডোনারকে সঠিক তথ্য দিতে সাহায্য করা</li>
    <li>জরুরি রক্তের ক্ষেত্রে ডোনার–রোগী সংযোগ</li>
    <li>নোটিফিকেশন Allow করতে উৎসাহ দেওয়া</li>
    <li>ভুল তথ্য থাকলে অ্যাডমিনকে জানানো</li>
  </ul>

  <h2>৫. দ্রুত FAQ</h2>
  <div class="card">
    <p><strong>প্রশ্ন:</strong> অ্যাপ ডাউনলোড লাগে?<br/><strong>উত্তর:</strong> না, ব্রাউজার/ওয়েবসাইটই যথেষ্ট। iPhone-এ Home Screen-এ যোগ করলে সুবিধা হয়।</p>
    <p><strong>প্রশ্ন:</strong> তথ্য কি নিরাপদ?<br/><strong>উত্তর:</strong> লগইন ও OTP দিয়ে অ্যাকাউন্ট সুরক্ষিত। ফোন নম্বর শুধু প্রয়োজনমতো যোগাযোগের জন্য।</p>
    <p><strong>প্রশ্ন:</strong> টাকা লাগে?<br/><strong>উত্তর:</strong> ডোনার রেজিস্ট্রেশন ও খোঁজা বিনামূল্যে।</p>
  </div>
  `;

  const healthBody = `
  <div class="card">
    <strong>এই গাইড কাকে?</strong> ভলান্টিয়ারদের জন্য — হাসপাতাল কর্তৃপক্ষকে BloodLink স্বাস্থ্যসেবায় যুক্ত হওয়ার সুবিধা ও ব্যবহার বোঝাতে।
  </div>

  <h2>১. স্বাস্থ্যসেবা সেকশন কী?</h2>
  <p>BloodLink-এর <strong>স্বাস্থ্য সেবা</strong> পেজে হাসপাতাল/ডায়াগনস্টিক খোঁজা যায়, ডাক্তার ও সময়সূচি দেখা যায়, এবং অনলাইনে অ্যাপয়েন্টমেন্ট বুক করা যায়। হাসপাতাল কর্তৃপক্ষ একটি প্রাইভেট পোর্টাল লিংক দিয়ে সব ম্যানেজ করে।</p>
  ${imgTag("07-healthcare", "পাবলিক স্বাস্থ্য সেবা পেজ — এখান থেকে হাসপাতাল খোঁজা যায়")}

  <h2>২. হাসপাতাল যুক্ত হলে কী কী সুবিধা?</h2>
  <table>
    <tr><th>সুবিধা</th><th>ব্যাখ্যা (কর্তৃপক্ষকে বলুন)</th></tr>
    <tr><td>অনলাইন উপস্থিতি</td><td>রোগী জেলা/নাম দিয়ে হাসপাতাল খুঁজে পাবে</td></tr>
    <tr><td>ডাক্তার সিডিউল</td><td>কোন ডাক্তার কোন দিন বসেন — ওয়েবে দেখা যাবে</td></tr>
    <tr><td>অনলাইন অ্যাপয়েন্টমেন্ট</td><td>রোগী ঘরে বসে বুকিং করতে পারবে, সিরিয়াল পাবে</td></tr>
    <tr><td>সহজ পোর্টাল</td><td>একটা লিংকেই ডাক্তার/অ্যাপয়েন্টমেন্ট ম্যানেজ</td></tr>
    <tr><td>রক্তদাতা নেটওয়ার্ক</td><td>জরুরি রক্তে BloodLink ডোনার সাপোর্ট</td></tr>
  </table>

  <h2>৩. কর্তৃপক্ষকে বোঝানোর কথা (স্ক্রিপ্ট)</h2>
  <div class="say">
    <strong>বলুন:</strong> “আলাদা অ্যাপ লাগবে না। আমরা সেটআপ করে একটা লিংক দিয়ে দিব। সেই লিংক ফোনে সেভ রাখলেই ডাক্তার ও অ্যাপয়েন্টমেন্ট ম্যানেজ করতে পারবেন। রোগীরা ওয়েবসাইট থেকে আপনাদের খুঁজে বুকিং করতে পারবে।”
  </div>

  <h3>WhatsApp টেক্সট (কপি করে পাঠান)</h3>
  <div class="card">
    আসসালামু আলাইকুম। BloodLink BD-তে আপনাদের হাসপাতাল যুক্ত হলে রোগী অনলাইনে খুঁজে পাবে, ডাক্তার সিডিউল দেখবে ও অ্যাপয়েন্টমেন্ট বুক করতে পারবে। আপনারা একটা সহজ লিংক দিয়ে সব ম্যানেজ করবেন। জরুরি রক্তে আমাদের ডোনার নেটওয়ার্কও সাহায্য করবে। আগ্রহ থাকলে জানাবেন।
  </div>

  <h2>৪. পাবলিক হাসপাতাল পেজ কেমন দেখায়</h2>
  <p>রোগী এই পেজে ডাক্তার দেখে অ্যাপয়েন্টমেন্ট নিতে পারে।</p>
  ${imgTag("08-healthcare-company", "হাসপাতালের পাবলিক পেজ — ডাক্তার ও বুকিং")}

  <h2>৫. হাসপাতাল পোর্টাল — কর্তৃপক্ষ যা করবে</h2>
  <p>অ্যাডমিন যে লিংক দেবে (উদাহরণ): <code>bloodlinkbd.org/healthcare/manage/hospital-name</code></p>
  ${imgTag("09-hospital-portal", "হাসপাতাল ম্যানেজ পোর্টাল — প্রথম স্ক্রিন/স্ট্যাটস")}

  <h3>A) ডাক্তার ট্যাব</h3>
  <ol class="steps">
    <li>ডাক্তারের নাম, বিশেষত্ব, রুম, ফোন দিন</li>
    <li>সাপ্তাহিক দিন ও সময় সেট করুন</li>
    <li>প্রতিদিন কতজন রোগী নেবেন লিখুন</li>
    <li>Save করুন</li>
  </ol>
  ${imgTag("10-hospital-doctors", "ডাক্তার ম্যানেজ স্ক্রিন")}

  <h3>B) অ্যাপয়েন্টমেন্ট ট্যাব</h3>
  <ol class="steps">
    <li>Pending দেখে Confirm করুন</li>
    <li>প্রয়োজনে তারিখ বদলান / ক্যানসেল করুন</li>
    <li>ম্যানুয়ালি অ্যাপয়েন্টমেন্ট এন্ট্রি করতে পারেন</li>
    <li>CSV এক্সপোর্ট করে রেকর্ড রাখতে পারেন</li>
  </ol>
  ${imgTag("11-hospital-appointments", "অ্যাপয়েন্টমেন্ট ম্যানেজ স্ক্রিন")}

  <h2>৬. ভলান্টিয়ারের রোল (২টি হাসপাতাল ম্যানেজ)</h2>
  <ul>
    <li>হাসপাতাল কর্তৃপক্ষকে সুবিধা বোঝানো ও রাজি করানো</li>
    <li>অ্যাডমিনের কাছ থেকে পোর্টাল লিংক নিয়ে কর্তৃপক্ষকে দেওয়া</li>
    <li>প্রথম সেটআপে ডাক্তার/সিডিউল এন্ট্রিতে সাহায্য</li>
    <li>নিয়মিত চেক: সিডিউল আপডেট আছে কি না</li>
    <li>জরুরি রক্তে হাসপাতাল ↔ ডোনার সংযোগ</li>
    <li>কাজের প্রোগ্রেস ভলান্টিয়ার পোর্টালে নোট করা</li>
  </ul>

  <h2>৭. সেটআপ চেকলিস্ট (মিটিংয়ে সাথে নিন)</h2>
  <div class="card">
    ☐ হাসপাতালের সঠিক নাম (বাংলা/ইংরেজি)<br/>
    ☐ যোগাযোগের মোবাইল ও দায়িত্বপ্রাপ্ত ব্যক্তি<br/>
    ☐ জেলা / উপজেলা<br/>
    ☐ প্রথম ৩–৫ জন ডাক্তারের সিডিউল<br/>
    ☐ পোর্টাল লিংক ফোনে বুকমার্ক হয়েছে<br/>
    ☐ টেস্ট অ্যাপয়েন্টমেন্ট একটি করা হয়েছে
  </div>
  `;

  const bloodHtml = wrapHtml(
    "গাইড ১: BloodLink-এর কাজ ও ইউজারকে বোঝানো",
    "ভলান্টিয়ার প্রশিক্ষণ ম্যানুয়াল — স্ক্রিনশটসহ ধাপভিত্তিক নির্দেশনা",
    bloodBody,
  );
  const healthHtml = wrapHtml(
    "গাইড ২: স্বাস্থ্যসেবা ও হাসপাতাল কর্তৃপক্ষকে বোঝানো",
    "ভলান্টিয়ার প্রশিক্ষণ ম্যানুয়াল — সুবিধা, স্ক্রিপ্ট ও পোর্টাল স্ক্রিনশট",
    healthBody,
  );

  const bloodHtmlPath = path.join(OUT, "01-bloodlink-volunteer-guide.html");
  const healthHtmlPath = path.join(OUT, "02-healthcare-hospital-guide.html");
  const bloodPdfPath = path.join(OUT, "01-bloodlink-volunteer-guide.pdf");
  const healthPdfPath = path.join(OUT, "02-healthcare-hospital-guide.pdf");

  await writeFile(bloodHtmlPath, bloodBody.includes("screenshots") ? bloodHtml : bloodHtml);
  await writeFile(bloodHtmlPath, bloodHtml);
  await writeFile(healthHtmlPath, healthHtml);

  await htmlToPdf(browser, bloodHtmlPath, bloodPdfPath);
  await htmlToPdf(browser, healthHtmlPath, healthPdfPath);

  // Copy PDFs/HTML to artifacts for cloud agent delivery
  for (const f of [
    "01-bloodlink-volunteer-guide.pdf",
    "02-healthcare-hospital-guide.pdf",
    "01-bloodlink-volunteer-guide.html",
    "02-healthcare-hospital-guide.html",
  ]) {
    await copyFile(path.join(OUT, f), path.join(ARTIFACTS, f)).catch(() => {});
  }

  for (const name of await (await import("fs/promises")).readdir(SHOTS)) {
    await copyFile(path.join(SHOTS, name), path.join(ARTIFACTS, `guide_${name}`)).catch(() => {});
  }

  await browser.close();
  console.log("Done. PDFs in", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
