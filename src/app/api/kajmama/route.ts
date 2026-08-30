import { fail, ok } from "@/lib/kajmama/http";
import { workerList } from "@/lib/kajmama/public";
import { categoriesWithCounts, readKajmamaStore } from "@/lib/kajmama/store";
import { DISTRICTS } from "@/lib/kajmama/constants";

export const runtime = "nodejs";

export async function GET() {
  try {
    const store = await readKajmamaStore();
    const workers = workerList(store);
    return ok({
      settings: {
        siteName: store.settings.siteName,
        siteNameBn: store.settings.siteNameBn,
        taglineBn: store.settings.taglineBn,
        taglineEn: store.settings.taglineEn,
      },
      categories: categoriesWithCounts(store),
      districts: DISTRICTS,
      featuredWorkers: workers.filter((w) => w.verified).slice(0, 6),
      stats: {
        workers: workers.length,
        jobs: store.jobs.filter((j) => j.status === "open").length,
        completed: store.bookings.filter((b) => b.status === "completed").length,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load", 500);
  }
}
