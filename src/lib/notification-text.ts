import type { AppNotification, BloodPost, Donor } from "./types";
import type { Locale } from "./i18n/dictionaries";

export function newDonorAdminTexts(donor: Pick<Donor, "name" | "bloodGroup" | "district" | "area">) {
  const place = [donor.area, donor.district].filter(Boolean).join(", ");
  return {
    titleEn: "New donor registered",
    titleBn: "নতুন donor registration",
    bodyEn: `${donor.name} joined BloodLink (${donor.bloodGroup}${place ? ` · ${place}` : ""}).`,
    bodyBn: `${donor.name} BloodLink-এ যোগ দিয়েছেন (${donor.bloodGroup}${place ? ` · ${place}` : ""})।`,
  };
}

export function bloodRequestTexts(post: BloodPost) {
  return {
    titleEn: `Blood needed: ${post.bloodGroup}`,
    titleBn: `রক্ত দরকার: ${post.bloodGroup}`,
    bodyEn: `${post.patientName} needs ${post.unitsNeeded} bag(s) of ${post.bloodGroup} at ${post.hospital}, ${post.area}, ${post.district}. Needed by ${post.neededBy}.`,
    bodyBn: `${post.patientName}-এর জন্য ${post.hospital}, ${post.area}, ${post.district}-এ ${post.bloodGroup} রক্ত ${post.unitsNeeded} ব্যাগ দরকার। তারিখ: ${post.neededBy}।`,
  };
}

export function goldBlessingTexts(name: string, donationCount: number) {
  return {
    titleEn: "A crimson blessing from BloodLink",
    titleBn: "BloodLink-এর রক্তিম শুভেচ্ছা",
    bodyEn: `Dear ${name}, this month you stand as our Gold donor — ${donationCount} lives touched through your courage. Every drop you gave carried hope into a family's darkest hour. BloodLink bows to your humanity. Keep shining; Bangladesh needs hearts like yours.`,
    bodyBn: `প্রিয় ${name}, এই মাসে আপনি আমাদের গোল্ড ডোনার — আপনার সাহসে স্পর্শ পেয়েছে ${donationCount}টি জীবন। আপনার দেওয়া প্রতিটি বিন্দু কোনো পরিবারের অন্ধকারে আলো এনেছে। BloodLink নত হয় আপনার মানবতার কাছে। জ্বলে উঠুন; বাংলাদেশের দরকার আপনার মতো হৃদয়।`,
  };
}

export function dailyReminderTexts() {
  return {
    titleEn: "Update your donation status",
    titleBn: "রক্তদানের স্ট্যাটাস আপডেট করুন",
    bodyEn:
      "If you donated blood, please update your last donation date now so seekers get accurate availability.",
    bodyBn:
      "যদি রক্ত দিয়ে থাকেন, এখনই শেষ রক্তদানের তারিখ আপডেট করুন — যাতে খোঁজকারীরা সঠিক অ্যাভেইলেবিলিটি পান।",
  };
}

export function contactChangeResultTexts(approved: boolean) {
  if (approved) {
    return {
      titleEn: "Contact change approved",
      titleBn: "যোগাযোগ তথ্য পরিবর্তন অনুমোদিত",
      bodyEn: "The admin approved your email/phone change request. Your profile is updated.",
      bodyBn:
        "অ্যাডমিন আপনার ইমেইল/ফোন পরিবর্তনের অনুরোধ অনুমোদন করেছেন। আপনার প্রোফাইল আপডেট হয়েছে।",
    };
  }
  return {
    titleEn: "Contact change declined",
    titleBn: "যোগাযোগ তথ্য পরিবর্তন প্রত্যাখ্যাত",
    bodyEn: "The admin declined your email/phone change request. Contact the admin if you need help.",
    bodyBn:
      "অ্যাডমিন আপনার ইমেইল/ফোন পরিবর্তনের অনুরোধ প্রত্যাখ্যান করেছেন। সাহায্য লাগলে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  };
}

export function localizeNotification(
  note: Pick<
    AppNotification,
    "title" | "body" | "titleEn" | "bodyEn" | "titleBn" | "bodyBn"
  >,
  locale: Locale,
) {
  if (locale === "bn") {
    return {
      title: note.titleBn || note.title,
      body: note.bodyBn || note.body,
    };
  }
  return {
    title: note.titleEn || note.title,
    body: note.bodyEn || note.body,
  };
}

export function withBilingual(texts: {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
}) {
  return {
    title: texts.titleEn,
    body: texts.bodyEn,
    titleEn: texts.titleEn,
    bodyEn: texts.bodyEn,
    titleBn: texts.titleBn,
    bodyBn: texts.bodyBn,
  };
}
