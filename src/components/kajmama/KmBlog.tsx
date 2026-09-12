"use client";

import Link from "next/link";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";

const POSTS = [
  {
    id: "choose",
    bn: { title: "কীভাবে বিশ্বস্ত মিস্ত্রি বেছে নেবেন", body: "রেটিং, ভেরিফিকেশন ও এলাকা মিলিয়ে দেখুন। প্রিমিয়াম ব্যাজ মানে অ্যাডমিন চেক করা প্রোফাইল।" },
    en: { title: "How to pick a trusted worker", body: "Match rating, verification, and area. A premium badge means the profile was admin-checked." },
  },
  {
    id: "post",
    bn: { title: "কাজ পোস্ট করলে কী হয়", body: "কাজের ধরন, জেলা ও বাজেট লিখুন। কাছের কর্মীরা আগ্রহ দেখাবে, তারপর চ্যাট করে ঠিক করুন।" },
    en: { title: "What happens when you post a job", body: "Add job type, district, and budget. Nearby workers respond, then you chat and confirm." },
  },
  {
    id: "phone",
    bn: { title: "ফোন নম্বর কেন লুকানো", body: "বুকিং গ্রহণের আগে নম্বর মাস্ক থাকে — স্প্যাম কমাতে এবং দুই পক্ষ নিরাপদ রাখতে।" },
    en: { title: "Why phone numbers stay hidden", body: "Numbers stay masked until a booking is accepted — less spam, safer for both sides." },
  },
];

export function KmBlog() {
  const { lang } = useKm();
  const bn = lang === "bn";
  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{bn ? "ব্লগ ও পরামর্শ" : "Blog & tips"}</h1>
          <p className="km-muted">{bn ? "কাজ হায়ার করার আগে পড়ে নিন।" : "Read before you hire."}</p>
        </div>
      </div>
      <div className="km-grid-3">
        {POSTS.map((p) => (
          <article key={p.id} className="km-card">
            <h3>{bn ? p.bn.title : p.en.title}</h3>
            <p className="km-muted">{bn ? p.bn.body : p.en.body}</p>
            <Link className="km-seeall" href={`${KAJMAMA_BASE}/workers`}>
              {bn ? "কর্মী খুঁজুন →" : "Find a worker →"}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
