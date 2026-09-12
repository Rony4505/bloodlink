import { newId } from "./http";
import { sendKajmamaPush } from "./push";
import { KAJMAMA_BASE } from "./constants";
import type { AppNotification, KajmamaStore } from "./types";

export type NoteDraft = {
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  href?: string;
  kind: string;
};

export function addNote(store: KajmamaStore, userId: string, draft: NoteDraft): AppNotification {
  const note: AppNotification = {
    id: newId("nt"),
    userId,
    titleBn: draft.titleBn,
    titleEn: draft.titleEn,
    bodyBn: draft.bodyBn,
    bodyEn: draft.bodyEn,
    href: draft.href || `${KAJMAMA_BASE}/dashboard`,
    kind: draft.kind,
    read: false,
    createdAt: new Date().toISOString(),
  };
  store.notifications.unshift(note);
  if (store.notifications.length > 500) store.notifications = store.notifications.slice(0, 500);
  return note;
}

export function workerWelcomeNotes(store: KajmamaStore, userId: string) {
  addNote(store, userId, {
    kind: "welcome",
    titleBn: "KajMama-তে স্বাগতম",
    titleEn: "Welcome to KajMama",
    bodyBn: "প্রোফাইল খোলা হয়েছে। কাজ নিতে সতর্কবার্তা মেনে চলুন — সাইটের বাইরে লেনদেন নিষেধ।",
    bodyEn: "Your profile is open. Follow the safety rules — no off-site payments.",
    href: `${KAJMAMA_BASE}/dashboard`,
  });
  addNote(store, userId, {
    kind: "safety",
    titleBn: "সতর্কতা: পেমেন্ট শুধু ওয়েবসাইটে",
    titleEn: "Warning: pay only on the website",
    bodyBn: "কাজদাতার ব্যক্তিগত বিকাশে টাকা নেবেন না। OTP/পিন দেবেন না। জামানত চাইলে প্রতারণা।",
    bodyEn: "Do not take personal bKash. Never share OTP. Anyone asking for a deposit is a scam.",
    href: `${KAJMAMA_BASE}/dashboard`,
  });
}

export async function pingPush(userId: string, note: NoteDraft) {
  await sendKajmamaPush([userId], {
    title: note.titleBn,
    body: note.bodyBn,
    url: note.href || `${KAJMAMA_BASE}/dashboard`,
    tag: note.kind,
  });
}
