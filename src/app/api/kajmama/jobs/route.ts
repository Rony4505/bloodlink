import { getSessionUser } from "@/lib/kajmama/auth";
import { DISTRICTS } from "@/lib/kajmama/constants";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { siteFeeOf } from "@/lib/kajmama/premium";
import { addNote, pingPush } from "@/lib/kajmama/notify";
import { findJob, findUser, readKajmamaStore, storeCategories, updateKajmamaStore, workerIsBusy } from "@/lib/kajmama/store";
import type { Job } from "@/lib/kajmama/types";

export const runtime = "nodejs";

function serializeJob(job: Job, store: Awaited<ReturnType<typeof readKajmamaStore>>) {
  const hirer = findUser(store, job.hirerId);
  const worker = job.workerId ? findUser(store, job.workerId) : undefined;
  const category = storeCategories(store).find((c) => c.id === job.categoryId);
  return {
    ...job,
    category,
    hirerName: hirer?.name || "কাজদাতা",
    workerName: worker?.name,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = await readKajmamaStore();
  const category = searchParams.get("category") || "";
  const district = searchParams.get("district") || "";
  const upazila = searchParams.get("upazila") || "";
  const mine = searchParams.get("mine") === "1";
  const me = mine ? await getSessionUser() : null;

  let jobs = store.jobs.slice();
  if (mine && me) {
    jobs = jobs.filter((j) => j.hirerId === me.id || j.workerId === me.id);
  } else {
    jobs = jobs.filter((j) => j.status === "open");
  }
  if (category) jobs = jobs.filter((j) => j.categoryId === category);
  if (district) jobs = jobs.filter((j) => j.district === district);
  if (upazila) jobs = jobs.filter((j) => j.upazila === upazila);
  jobs.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return ok({ jobs: jobs.map((j) => serializeJob(j, store)) });
}

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);

  try {
    const body = (await request.json()) as {
      categoryId?: string;
      title?: string;
      description?: string;
      district?: string;
      upazila?: string;
      area?: string;
      budget?: number;
      whenText?: string;
      workerId?: string;
    };
    const categoryId = body.categoryId || "";
    const cats = storeCategories(await readKajmamaStore());
    if (!cats.some((c) => c.id === categoryId)) return fail("ক্যাটাগরি বেছে নিন");
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    if (title.length < 4) return fail("কাজের শিরোনাম লিখুন");
    if (description.length < 8) return fail("কাজটা একটু বিস্তারিত লিখুন");
    const district = DISTRICTS.includes(body.district || "") ? body.district! : me.district;
    const area = (body.area || me.area).trim();
    const upazila = (body.upazila || "").trim() || area;
    const budget = Math.max(0, Number(body.budget) || 0);
    if (!budget) return fail("বাজেট লিখুন");
    const whenText = (body.whenText || "").trim() || "আলোচনাসাপেক্ষ";

    let jobId = "";
    let hiredWorkerId = "";
    let bookingId = "";
    const store = await updateKajmamaStore((s) => {
      let workerId: string | undefined;
      let status: Job["status"] = "open";
      if (body.workerId) {
        const w = findUser(s, body.workerId);
        if (!w || w.role !== "worker" || w.blocked) throw new Error("ওয়ার্কার পাওয়া যায়নি");
        if (workerIsBusy(s, w.id)) throw new Error("এই কর্মী এখন অন্য কাজে ব্যস্ত / পেমেন্ট বাকি");
        workerId = w.id;
        status = "assigned";
      }
      const job: Job = {
        id: newId("job"),
        hirerId: me.id,
        workerId,
        categoryId,
        title,
        description,
        district,
        upazila,
        area,
        budget,
        whenText,
        status,
        createdAt: new Date().toISOString(),
      };
      jobId = job.id;
      s.jobs.unshift(job);
      if (workerId) {
        const fee = siteFeeOf(budget, s.settings.commissionPct);
        const bk = {
          id: newId("bk"),
          jobId: job.id,
          hirerId: me.id,
          workerId,
          status: "pending" as const,
          price: budget,
          commissionPct: s.settings.commissionPct,
          siteFee: fee.siteFee,
          workerPayout: fee.workerPayout,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        s.bookings.unshift(bk);
        bookingId = bk.id;
        hiredWorkerId = workerId;
        addNote(s, workerId, {
          kind: "hire",
          titleBn: "নতুন হায়ার রিকোয়েস্ট",
          titleEn: "New hire request",
          bodyBn: `${me.name} আপনাকে «${title}» কাজের জন্য চান। একসেপ্ট বা না বলুন।`,
          bodyEn: `${me.name} wants to hire you for “${title}”. Accept or decline.`,
          href: `/kajmama/bookings/${bk.id}`,
        });
      }
    });

    const job = findJob(store, jobId);
    if (!job) return fail("পোস্ট হয়নি", 500);
    if (hiredWorkerId) {
      await pingPush(hiredWorkerId, {
        kind: "hire",
        titleBn: "নতুন হায়ার রিকোয়েস্ট",
        titleEn: "New hire request",
        bodyBn: `${me.name} আপনাকে কাজের জন্য চান।`,
        bodyEn: `${me.name} wants to hire you.`,
        href: `/kajmama/bookings/${bookingId}`,
      });
    }
    const booking = store.bookings.find((b) => b.jobId === job.id);
    return ok({ job: serializeJob(job, store), bookingId: booking?.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "পোস্ট হয়নি");
  }
}
