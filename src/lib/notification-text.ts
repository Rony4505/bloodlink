import type { AppNotification, BloodPost } from "./types";
import type { Locale } from "./i18n/dictionaries";

export function bloodRequestTexts(post: BloodPost) {
  return {
    titleEn: `Blood needed: ${post.bloodGroup}`,
    titleBn: `রক্ত দরকার: ${post.bloodGroup}`,
    bodyEn: `${post.patientName} needs ${post.unitsNeeded} bag(s) of ${post.bloodGroup} at ${post.hospital}, ${post.area}, ${post.district}. Needed by ${post.neededBy}.`,
    bodyBn: `${post.patientName}-এর জন্য ${post.hospital}, ${post.area}, ${post.district}-এ ${post.bloodGroup} রক্ত ${post.unitsNeeded} ব্যাগ দরকার। তারিখ: ${post.neededBy}।`,
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
