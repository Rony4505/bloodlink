import { getSessionUser } from "@/lib/kajmama/auth";
import { CATEGORIES, DISTRICTS } from "@/lib/kajmama/constants";
import { fail, ok } from "@/lib/kajmama/http";
import { toSessionUser, workerList } from "@/lib/kajmama/public";
import { readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = await readKajmamaStore();
  const workers = workerList(store, {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    district: searchParams.get("district") || undefined,
  });
  return ok({ workers });
}

export async function PATCH(request: Request) {
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  try {
    const body = (await request.json()) as {
      name?: string;
      district?: string;
      area?: string;
      bio?: string;
      skills?: string[];
      experienceYears?: number;
      hourlyRate?: number;
      jobRate?: number;
      available?: boolean;
    };
    const store = await updateKajmamaStore((s) => {
      const u = s.users.find((x) => x.id === me.id);
      if (!u) throw new Error("ইউজার পাওয়া যায়নি");
      if (body.name?.trim()) u.name = body.name.trim();
      if (body.district && DISTRICTS.includes(body.district)) u.district = body.district;
      if (typeof body.area === "string" && body.area.trim()) u.area = body.area.trim();
      if (typeof body.bio === "string") u.bio = body.bio.trim().slice(0, 400);
      if (Array.isArray(body.skills) && u.role === "worker") {
        const ids = new Set(CATEGORIES.map((c) => c.id));
        u.skills = body.skills.filter((id) => ids.has(id)).slice(0, 4);
      }
      if (typeof body.experienceYears === "number") u.experienceYears = Math.max(0, body.experienceYears);
      if (typeof body.hourlyRate === "number") u.hourlyRate = Math.max(0, body.hourlyRate);
      if (typeof body.jobRate === "number") u.jobRate = Math.max(0, body.jobRate);
      if (typeof body.available === "boolean") u.available = body.available;
    });
    const fresh = store.users.find((u) => u.id === me.id);
    if (!fresh) return fail("ইউজার পাওয়া যায়নি", 404);
    return ok({ user: toSessionUser(store, fresh) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Save failed");
  }
}
