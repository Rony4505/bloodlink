import {
  DEFAULT_MAX_SUCCESSFUL_REFS,
  DEFAULT_MIN_SUCCESSFUL_FOR_WITHDRAW,
} from "@/lib/referral";
import type { ReferralSettings } from "@/lib/types";

const DEFAULT_RULES_EN = `BloodLink Referral Rewards — Rules

1. Share your personal referral link or code. Only new donors who register through it can count.
2. You earn the reward amount set by admin for each successful credited referral.
3. A referral is credited only when ALL of these are true:
   • The referral campaign is currently ON (within admin start/end dates).
   • You have not reached the maximum successful referrals (default 30); after that your referral is closed.
   • The new donor is not you (no self-referral).
   • Their phone number has never been credited for any referral before.
   • Their email has never been credited for any referral before.
   • They did NOT open the link inside an in-app browser (WhatsApp, Facebook, Instagram, Telegram, Line, Viber, or Messenger WebView). They must open in Chrome, Safari, or another normal browser.
   • They enable deliverable browser push notifications (Allow) on BloodLink.
4. If they register from an in-app browser, their account can still be created, but the referral is missed (in-app browser).
5. If they register before enabling push, the referral stays pending until they Allow push; then we try to credit.
6. Duplicate phone or email already credited elsewhere is a miss.
7. Cash-out (withdraw) is allowed only after at least 15 successful credited referrals, and only to bKash or Nagad. Save your payout number first.
8. After you request a withdrawal, admin aims to pay within 48 hours and will mark the request paid.
9. Abuse, fake accounts, or rule violations may void rewards. Admin decisions are final.`;

const DEFAULT_RULES_BN = `BloodLink রেফারেল রিওয়ার্ড — নিয়মাবলী

১. আপনার ব্যক্তিগত রেফারেল লিংক বা কোড শেয়ার করুন। শুধু সেই লিংক দিয়ে নতুন ডোনার রেজিস্টার করলেই গণনা হবে।
২. অ্যাডমিন যে পরিমাণ নির্ধারণ করেছেন, প্রতি সফল ক্রেডিটেড রেফারেলে আপনি সেই পরিমাণ পাবেন।
৩. রেফারেল ক্রেডিট হবে কেবল যখন সব শর্ত পূরণ হবে:
   • রেফারেল ক্যাম্পেইন চালু আছে (অ্যাডমিনের শুরু/শেষ তারিখের ভিতরে)।
   • আপনি সর্বোচ্চ সফল রেফারেল সীমায় পৌঁছাননি (ডিফল্ট ৩০); তার পর রেফারেল বন্ধ হয়ে যায়।
   • নতুন ডোনার আপনি নিজে নন (সেলফ-রেফারেল নয়)।
   • তাদের ফোন নম্বর আগে কোনো রেফারেলে ক্রেডিট হয়নি।
   • তাদের ইমেইল আগে কোনো রেফারেলে ক্রেডিট হয়নি।
   • তারা ইন-অ্যাপ ব্রাউজারে (WhatsApp, Facebook, Instagram, Telegram, Line, Viber, Messenger WebView) লিংক খোলেননি। Chrome/Safari বা সাধারণ ব্রাউজারে খুলতে হবে।
   • তারা BloodLink-এ ডেলিভারেবল ব্রাউজার পুশ নোটিফিকেশন Allow করেছেন।
৪. ইন-অ্যাপ ব্রাউজার থেকে রেজিস্টার করলে অ্যাকাউন্ট হতে পারে, কিন্তু রেফারেল মিস (in-app browser)।
৫. পুশ চালু করার আগে রেজিস্টার করলে রেফারেল pending থাকবে; Allow করার পর ক্রেডিট চেষ্টা হবে।
৬. আগেই ক্রেডিট হওয়া ফোন/ইমেইল ডুপ্লিকেট হলে মিস।
৭. ক্যাশ-আউট (উইথড্র) কেবল কমপক্ষে ১৫টি সফল ক্রেডিটের পর, এবং শুধু bKash বা Nagad-এ। আগে পেআউট নম্বর সেভ করুন।
৮. উইথড্র রিকোয়েস্টের পর অ্যাডমিন ৪৮ ঘণ্টার মধ্যে পেমেন্ট করার লক্ষ্য রাখেন এবং paid মার্ক করবেন।
৯. অপব্যবহার বা নিয়ম ভাঙলে রিওয়ার্ড বাতিল হতে পারে। অ্যাডমিনের সিদ্ধান্ত চূড়ান্ত।`;

export function defaultReferralSettings(): ReferralSettings {
  return {
    enabled: false,
    rewardAmountBdt: 20,
    maxSuccessfulRefs: DEFAULT_MAX_SUCCESSFUL_REFS,
    minSuccessfulForWithdraw: DEFAULT_MIN_SUCCESSFUL_FOR_WITHDRAW,
    campaignStartAt: "",
    campaignEndAt: "",
    rulesBn: DEFAULT_RULES_BN,
    rulesEn: DEFAULT_RULES_EN,
    rewardOn: "registration",
    cashOutEnabled: false,
    adminNotes: "",
  };
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeIsoOrEmpty(raw: unknown): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toISOString();
}

export function normalizeReferralSettings(
  raw?: Partial<ReferralSettings> | null,
): ReferralSettings {
  const base = defaultReferralSettings();
  const amount = Number(raw?.rewardAmountBdt);
  const rulesBn = String(raw?.rulesBn ?? "").trim();
  const rulesEn = String(raw?.rulesEn ?? "").trim();
  return {
    enabled: Boolean(raw?.enabled),
    rewardAmountBdt:
      Number.isFinite(amount) && amount >= 0
        ? Math.min(10_000, Math.round(amount))
        : base.rewardAmountBdt,
    maxSuccessfulRefs: clampInt(
      raw?.maxSuccessfulRefs,
      base.maxSuccessfulRefs,
      1,
      500,
    ),
    minSuccessfulForWithdraw: clampInt(
      raw?.minSuccessfulForWithdraw,
      base.minSuccessfulForWithdraw,
      1,
      500,
    ),
    campaignStartAt: normalizeIsoOrEmpty(raw?.campaignStartAt),
    campaignEndAt: normalizeIsoOrEmpty(raw?.campaignEndAt),
    rulesBn: (rulesBn || base.rulesBn).slice(0, 8000),
    rulesEn: (rulesEn || base.rulesEn).slice(0, 8000),
    rewardOn: "registration",
    cashOutEnabled: Boolean(raw?.cashOutEnabled),
    adminNotes: String(raw?.adminNotes || "").trim().slice(0, 500),
  };
}
