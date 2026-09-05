import { getSessionUser } from "@/lib/kajmama/auth";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { siteFeeOf } from "@/lib/kajmama/premium";
import { addNote, pingPush } from "@/lib/kajmama/notify";
import { findJob, findUser, readKajmamaStore, storeCategories, updateKajmamaStore, workerIsBusy } from "@/lib/kajmama/store";

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
  const category = storeCategories(store).find((c) => c.id === job.categoryId);
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
        if (workerIsBusy(s, me.id)) throw new Error("আগের কাজের পেমেন্ট না হওয়া পর্যন্ত নতুন কাজ নেওয়া যাবে না");
        const fee = siteFeeOf(job.budget, s.settings.commissionPct);
        const bkId = newId("bk");
        s.bookings.unshift({
          id: bkId,
          jobId: job.id,
          hirerId: job.hirerId,
          workerId: me.id,
          status: "pending",
          price: job.budget,
          commissionPct: s.settings.commissionPct,
          siteFee: fee.siteFee,
          workerPayout: fee.workerPayout,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addNote(s, job.hirerId, {
          kind: "apply",
          titleBn: "একজন কর্মী আগ্রহ দেখিয়েছেন",
          titleEn: "A worker showed interest",
          bodyBn: `${me.name} «${job.title}» কাজে আগ্রহ দেখিয়েছেন।`,
          bodyEn: `${me.name} showed interest in “${job.title}”.`,
          href: `/kajmama/bookings/${bkId}`,
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
    if (body.action === "apply" && job) {
      await pingPush(job.hirerId, {
        kind: "apply",
        titleBn: "একজন কর্মী আগ্রহ দেখিয়েছেন",
        titleEn: "A worker showed interest",
        bodyBn: `${me.name} আপনার কাজে আগ্রহ দেখিয়েছেন।`,
        bodyEn: `${me.name} showed interest in your job.`,
        href: booking ? `/kajmama/bookings/${booking.id}` : "/kajmama/dashboard",
      });
    }
    return ok({ job, bookingId: booking?.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "কাজ হয়নি");
  }
}
