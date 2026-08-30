import { getSessionUser } from "@/lib/kajmama/auth";
import { CATEGORIES } from "@/lib/kajmama/constants";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { findJob, findUser, readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readKajmamaStore();
  const job = findJob(store, id);
  if (!job) return fail("কাজ পাওয়া যায়নি", 404);
  const me = await getSessionUser();
  const hirer = findUser(store, job.hirerId);
  const worker = job.workerId ? findUser(store, job.workerId) : undefined;
  const category = CATEGORIES.find((c) => c.id === job.categoryId);
  const myBooking = me
    ? store.bookings.find(
        (b) => b.jobId === job.id && (b.hirerId === me.id || b.workerId === me.id),
      )
    : undefined;
  return ok({
    job: {
      ...job,
      category,
      hirerName: hirer?.name || "কাজদাতা",
      workerName: worker?.name,
    },
    canApply: !!me && me.role === "worker" && job.status === "open" && job.hirerId !== me.id && !myBooking,
    bookingId: myBooking?.id,
  });
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);

  const body = (await request.json()) as { action?: string };
  try {
    const store = await updateKajmamaStore((s) => {
      const job = findJob(s, id);
      if (!job) throw new Error("কাজ পাওয়া যায়নি");

      if (body.action === "apply") {
        if (me.role !== "worker") throw new Error("ওয়ার্কার অ্যাকাউন্ট দিয়ে আগ্রহ দিন");
        if (job.status !== "open") throw new Error("এই কাজ আর খোলা নেই");
        if (job.hirerId === me.id) throw new Error("নিজের কাজে আগ্রহ দেওয়া যায় না");
        const exists = s.bookings.find((b) => b.jobId === job.id && b.workerId === me.id);
        if (exists) throw new Error("ইতিমধ্যে আগ্রহ দেখিয়েছেন");
        s.bookings.unshift({
          id: newId("bk"),
          jobId: job.id,
          hirerId: job.hirerId,
          workerId: me.id,
          status: "pending",
          price: job.budget,
          commissionPct: s.settings.commissionPct,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      if (body.action === "cancel") {
        if (job.hirerId !== me.id) throw new Error("শুধু কাজদাতা বাতিল করতে পারেন");
        if (job.status === "completed") throw new Error("শেষ কাজ বাতিল হয় না");
        job.status = "cancelled";
        s.bookings.forEach((b) => {
          if (b.jobId === job.id && b.status !== "completed") {
            b.status = "cancelled";
            b.updatedAt = new Date().toISOString();
          }
        });
      }
    });
    const job = findJob(store, id);
    const booking = store.bookings.find((b) => b.jobId === id && (b.workerId === me.id || b.hirerId === me.id));
    return ok({ job, bookingId: booking?.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "কাজ হয়নি");
  }
}
