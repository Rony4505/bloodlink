import { getSessionUser } from "@/lib/kajmama/auth";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { siteFeeOf } from "@/lib/kajmama/premium";
import { addNote, pingPush, type NoteDraft } from "@/lib/kajmama/notify";
import { toPublicUser } from "@/lib/kajmama/public";
import {
  findBooking,
  findJob,
  findUser,
  readKajmamaStore,
  setWorkerAvailability,
  storeCategories,
  updateKajmamaStore,
  workerIsBusy,
} from "@/lib/kajmama/store";
import type { BookingStatus } from "@/lib/kajmama/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function canSee(userId: string, hirerId: string, workerId: string) {
  return userId === hirerId || userId === workerId;
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  const store = await readKajmamaStore();
  const booking = findBooking(store, id);
  if (!booking || !canSee(me.id, booking.hirerId, booking.workerId)) {
    return fail("বুকিং পাওয়া যায়নি", 404);
  }
  const job = findJob(store, booking.jobId);
  const hirer = findUser(store, booking.hirerId);
  const worker = findUser(store, booking.workerId);
  const reveal = ["accepted", "in_progress", "completed", "paid"].includes(booking.status);
  const messages = store.messages
    .filter((m) => m.bookingId === booking.id)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const myReview = store.reviews.find((r) => r.bookingId === booking.id && r.fromUserId === me.id);
  const category = job ? storeCategories(store).find((c) => c.id === job.categoryId) : undefined;
  const fee = siteFeeOf(booking.price, booking.commissionPct);

  return ok({
    booking: {
      ...booking,
      siteFee: booking.siteFee ?? fee.siteFee,
      workerPayout: booking.workerPayout ?? fee.workerPayout,
    },
    job: job ? { ...job, category } : null,
    hirer: hirer ? toPublicUser(store, hirer, { revealPhone: reveal }) : null,
    worker: worker ? toPublicUser(store, worker, { revealPhone: reveal }) : null,
    messages: messages.map((m) => ({
      id: m.id,
      fromUserId: m.fromUserId,
      text: m.text,
      createdAt: m.createdAt,
      mine: m.fromUserId === me.id,
    })),
    myReview,
    meId: me.id,
    payments: {
      banks: store.settings.banks,
      mobiles: store.settings.mobiles,
      commissionPct: booking.commissionPct,
    },
  });
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  const body = (await request.json()) as {
    action?: string;
    text?: string;
    rating?: number;
    status?: BookingStatus;
    paymentMethod?: string;
    paymentRef?: string;
  };

  try {
    const pings: { userId: string; draft: NoteDraft }[] = [];
    await updateKajmamaStore((s) => {
      const booking = findBooking(s, id);
      if (!booking || !canSee(me.id, booking.hirerId, booking.workerId)) {
        throw new Error("বুকিং পাওয়া যায়নি");
      }
      const job = findJob(s, booking.jobId);
      const now = new Date().toISOString();

      if (body.action === "message") {
        const text = (body.text || "").trim();
        if (!text) throw new Error("মেসেজ লিখুন");
        if (booking.status === "cancelled" || booking.status === "declined") {
          throw new Error("এই বুকিংয়ে চ্যাট বন্ধ");
        }
        s.messages.push({
          id: newId("m"),
          bookingId: booking.id,
          fromUserId: me.id,
          text: text.slice(0, 800),
          createdAt: now,
        });
        booking.updatedAt = now;
        const otherId = me.id === booking.hirerId ? booking.workerId : booking.hirerId;
        const draft: NoteDraft = {
          kind: "chat",
          titleBn: "নতুন মেসেজ",
          titleEn: "New message",
          bodyBn: text.slice(0, 80),
          bodyEn: text.slice(0, 80),
          href: `/kajmama/bookings/${booking.id}`,
        };
        addNote(s, otherId, draft);
        pings.push({ userId: otherId, draft });
        return;
      }

      if (body.action === "status") {
        const next = body.status;
        if (next === "accepted") {
          if (me.id !== booking.workerId) throw new Error("ওয়ার্কার একসেপ্ট করবেন");
          if (booking.status !== "pending") throw new Error("এখন একসেপ্ট করা যায় না");
          if (workerIsBusy(s, booking.workerId)) {
            throw new Error("আগের কাজের পেমেন্ট না হওয়া পর্যন্ত নতুন কাজ নেওয়া যাবে না");
          }
          booking.status = "accepted";
          if (job) {
            job.status = "assigned";
            job.workerId = booking.workerId;
          }
          s.bookings.forEach((b) => {
            if (b.jobId === booking.jobId && b.id !== booking.id && b.status === "pending") {
              b.status = "declined";
              b.updatedAt = now;
            }
          });
          setWorkerAvailability(s, booking.workerId);
        } else if (next === "declined") {
          if (me.id !== booking.workerId && me.id !== booking.hirerId) throw new Error("অনুমতি নেই");
          if (!["pending", "accepted"].includes(booking.status)) throw new Error("বাতিল করা যায় না");
          booking.status = me.id === booking.workerId && booking.status === "pending" ? "declined" : "cancelled";
          setWorkerAvailability(s, booking.workerId);
        } else if (next === "in_progress") {
          if (me.id !== booking.workerId) throw new Error("ওয়ার্কার কাজ শুরু করবেন");
          if (booking.status !== "accepted") throw new Error("আগে একসেপ্ট করুন");
          booking.status = "in_progress";
          if (job) job.status = "in_progress";
        } else if (next === "completed") {
          if (me.id !== booking.hirerId) throw new Error("কাজদাতা কাজ শেষ মার্ক করবেন");
          if (!["accepted", "in_progress"].includes(booking.status)) throw new Error("এখন শেষ করা যায় না");
          booking.status = "completed";
          if (job) job.status = "completed";
        } else {
          throw new Error("অবস্থা সঠিক নয়");
        }
        booking.updatedAt = now;
        const href = `/kajmama/bookings/${booking.id}`;
        if (next === "accepted") {
          const draft: NoteDraft = {
            kind: "accepted",
            titleBn: "কর্মী কাজ গ্রহণ করেছেন",
            titleEn: "Worker accepted",
            bodyBn: "বুকিং একসেপ্ট হয়েছে। চ্যাট করে সময় ঠিক করুন।",
            bodyEn: "The worker accepted. Chat to confirm timing.",
            href,
          };
          addNote(s, booking.hirerId, draft);
          pings.push({ userId: booking.hirerId, draft });
        } else if (next === "declined") {
          const other = me.id === booking.workerId ? booking.hirerId : booking.workerId;
          const draft: NoteDraft = {
            kind: "declined",
            titleBn: "বুকিং বাতিল",
            titleEn: "Booking cancelled",
            bodyBn: "এই কাজ আর চলবে না।",
            bodyEn: "This job will not continue.",
            href,
          };
          addNote(s, other, draft);
          pings.push({ userId: other, draft });
        } else if (next === "in_progress") {
          const draft: NoteDraft = {
            kind: "progress",
            titleBn: "কাজ শুরু হয়েছে",
            titleEn: "Work started",
            bodyBn: "কর্মী কাজ শুরু করেছেন।",
            bodyEn: "The worker started the job.",
            href,
          };
          addNote(s, booking.hirerId, draft);
          pings.push({ userId: booking.hirerId, draft });
        } else if (next === "completed") {
          const draft: NoteDraft = {
            kind: "completed",
            titleBn: "কাজ শেষ — ওয়েবসাইটে পেমেন্ট করুন",
            titleEn: "Job done — pay on the website",
            bodyBn: "কাজদাতা কাজ শেষ মার্ক করেছেন। সাইটে পেমেন্ট না হলে পরের কাজ নিতে পারবেন না।",
            bodyEn: "The hirer marked the job complete. Pay on the site or the worker stays unavailable.",
            href,
          };
          addNote(s, booking.workerId, draft);
          pings.push({ userId: booking.workerId, draft });
        }
        return;
      }

      if (body.action === "pay") {
        if (me.id !== booking.hirerId) throw new Error("কাজদাতা পেমেন্ট করবেন");
        if (booking.status !== "completed") throw new Error("কাজ শেষ হলে ওয়েবসাইটে পেমেন্ট করুন");
        const method = (body.paymentMethod || "").trim();
        const ref = (body.paymentRef || "").trim();
        if (!method || !ref) throw new Error("পেমেন্ট মাধ্যম ও ট্রান্সঅ্যাকশন আইডি দিন");
        booking.status = "paid";
        booking.paidAt = now;
        booking.paymentMethod = method.slice(0, 80);
        booking.paymentRef = ref.slice(0, 80);
        booking.updatedAt = now;
        setWorkerAvailability(s, booking.workerId);
        const draft: NoteDraft = {
          kind: "paid",
          titleBn: "পেমেন্ট হয়েছে",
          titleEn: "Payment received",
          bodyBn: "ওয়েবসাইটে পেমেন্ট নিশ্চিত। টাকা আপনার অ্যাকাউন্টে যাবে। এখন রেটিং দিতে পারেন।",
          bodyEn: "Website payment is confirmed. Payout goes to your account. You can rate now.",
          href: `/kajmama/bookings/${booking.id}`,
        };
        addNote(s, booking.workerId, draft);
        pings.push({ userId: booking.workerId, draft });
        return;
      }

      if (body.action === "review") {
        if (booking.status !== "paid") throw new Error("ওয়েবসাইটে পেমেন্ট হলে তবেই রেটিং দেওয়া যাবে");
        const exists = s.reviews.find((r) => r.bookingId === booking.id && r.fromUserId === me.id);
        if (exists) throw new Error("রিভিউ ইতিমধ্যে দেওয়া আছে");
        const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 0)));
        if (!rating) throw new Error("রেটিং দিন");
        const toUserId = me.id === booking.hirerId ? booking.workerId : booking.hirerId;
        s.reviews.push({
          id: newId("rv"),
          bookingId: booking.id,
          fromUserId: me.id,
          toUserId,
          rating,
          text: (body.text || "").trim().slice(0, 400),
          createdAt: now,
        });
        const draft: NoteDraft = {
          kind: "review",
          titleBn: "নতুন রেটিং",
          titleEn: "New rating",
          bodyBn: `${me.name} আপনাকে ${rating}★ দিয়েছেন।`,
          bodyEn: `${me.name} rated you ${rating}★.`,
          href: `/kajmama/bookings/${booking.id}`,
        };
        addNote(s, toUserId, draft);
        pings.push({ userId: toUserId, draft });
        return;
      }

      throw new Error("Unknown action");
    });
    await Promise.all(pings.map((p) => pingPush(p.userId, p.draft)));
    return ok({ ok: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "আপডেট হয়নি");
  }
}
