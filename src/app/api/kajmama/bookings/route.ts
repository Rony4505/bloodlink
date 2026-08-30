import { getSessionUser } from "@/lib/kajmama/auth";
import { CATEGORIES } from "@/lib/kajmama/constants";
import { fail, ok } from "@/lib/kajmama/http";
import { findJob, findUser, readKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  const store = await readKajmamaStore();
  const bookings = store.bookings
    .filter((b) => b.hirerId === me.id || b.workerId === me.id)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((b) => {
      const job = findJob(store, b.jobId);
      const otherId = b.hirerId === me.id ? b.workerId : b.hirerId;
      const other = findUser(store, otherId);
      const category = job ? CATEGORIES.find((c) => c.id === job.categoryId) : undefined;
      return {
        ...b,
        title: job?.title || "কাজ",
        categoryName: category?.nameBn,
        otherName: other?.name || "সদস্য",
      };
    });
  return ok({ bookings });
}
