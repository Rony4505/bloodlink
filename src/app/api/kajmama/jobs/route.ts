import { getSessionUser } from "@/lib/kajmama/auth";
import { CATEGORIES, DISTRICTS } from "@/lib/kajmama/constants";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { findJob, findUser, readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";
import type { Job } from "@/lib/kajmama/types";

export const runtime = "nodejs";

function serializeJob(job: Job, store: Awaited<ReturnType<typeof readKajmamaStore>>) {
  const hirer = findUser(store, job.hirerId);
  const worker = job.workerId ? findUser(store, job.workerId) : undefined;
  const category = CATEGORIES.find((c) => c.id === job.categoryId);
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
      area?: string;
      budget?: number;
      whenText?: string;
      workerId?: string;
    };
    const categoryId = body.categoryId || "";
    if (!CATEGORIES.some((c) => c.id === categoryId)) return fail("ক্যাটাগরি বেছে নিন");
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    if (title.length < 4) return fail("কাজের শিরোনাম লিখুন");
    if (description.length < 8) return fail("কাজটা একটু বিস্তারিত লিখুন");
    const district = DISTRICTS.includes(body.district || "") ? body.district! : me.district;
    const area = (body.area || me.area).trim();
    const budget = Math.max(0, Number(body.budget) || 0);
    if (!budget) return fail("বাজেট লিখুন");
    const whenText = (body.whenText || "").trim() || "আলোচনাসাপেক্ষ";

    let jobId = "";
    const store = await updateKajmamaStore((s) => {
      let workerId: string | undefined;
      let status: Job["status"] = "open";
      if (body.workerId) {
        const w = findUser(s, body.workerId);
        if (!w || w.role !== "worker" || w.blocked) throw new Error("ওয়ার্কার পাওয়া যায়নি");
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
        area,
        budget,
        whenText,
        status,
        createdAt: new Date().toISOString(),
      };
      jobId = job.id;
      s.jobs.unshift(job);
      if (workerId) {
        s.bookings.unshift({
          id: newId("bk"),
          jobId: job.id,
          hirerId: me.id,
          workerId,
          status: "pending",
          price: budget,
          commissionPct: s.settings.commissionPct,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const job = findJob(store, jobId);
    if (!job) return fail("পোস্ট হয়নি", 500);
    const booking = store.bookings.find((b) => b.jobId === job.id);
    return ok({ job: serializeJob(job, store), bookingId: booking?.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "পোস্ট হয়নি");
  }
}
