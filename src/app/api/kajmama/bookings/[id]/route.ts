import { getSessionUser } from "@/lib/kajmama/auth";
import { CATEGORIES } from "@/lib/kajmama/constants";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { toPublicUser } from "@/lib/kajmama/public";
import {
  findBooking,
  findJob,
  findUser,
  readKajmamaStore,
  updateKajmamaStore,
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
  const reveal = ["accepted", "in_progress", "completed"].includes(booking.status);
  const messages = store.messages
    .filter((m) => m.bookingId === booking.id)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const myReview = store.reviews.find((r) => r.bookingId === booking.id && r.fromUserId === me.id);
  const category = job ? CATEGORIES.find((c) => c.id === job.categoryId) : undefined;

  return ok({
    booking,
    job: job
      ? { ...job, category }
      : null,
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
  };

  try {
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
        return;
      }

      if (body.action === "status") {
        const next = body.status;
        if (next === "accepted") {
          if (me.id !== booking.workerId) throw new Error("ওয়ার্কার একসেপ্ট করবেন");
          if (booking.status !== "pending") throw new Error("এখন একসেপ্ট করা যায় না");
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
        } else if (next === "declined") {
          if (me.id !== booking.workerId && me.id !== booking.hirerId) throw new Error("অনুমতি নেই");
          if (!["pending", "accepted"].includes(booking.status)) throw new Error("বাতিল করা যায় না");
          booking.status = me.id === booking.workerId && booking.status === "pending" ? "declined" : "cancelled";
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
        return;
      }

      if (body.action === "review") {
        if (booking.status !== "completed") throw new Error("কাজ শেষ হলে রিভিউ দিন");
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
        return;
      }

      throw new Error("Unknown action");
    });
    return ok({ ok: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "আপডেট হয়নি");
  }
}
