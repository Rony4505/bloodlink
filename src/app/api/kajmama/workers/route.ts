import { getSessionUser } from "@/lib/kajmama/auth";
import { DISTRICTS } from "@/lib/kajmama/constants";
import { fail, ok } from "@/lib/kajmama/http";
import { toSessionUser, workerList } from "@/lib/kajmama/public";
import { applyPackage } from "@/lib/kajmama/premium";
import { readKajmamaStore, storeCategories, updateKajmamaStore } from "@/lib/kajmama/store";
import type { MobileBankingType } from "@/lib/kajmama/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = await readKajmamaStore();
  const workers = workerList(store, {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    district: searchParams.get("district") || undefined,
    upazila: searchParams.get("upazila") || undefined,
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
      upazila?: string;
      area?: string;
      bio?: string;
      skills?: string[];
      experienceYears?: number;
      hourlyRate?: number;
      jobRate?: number;
      available?: boolean;
      packageId?: string;
      paymentRef?: string;
      payout?: {
        bankName?: string;
        bankAccount?: string;
        bankHolder?: string;
        mobileBanking?: string;
        mobileBankingType?: MobileBankingType | "";
      };
    };
    const store = await updateKajmamaStore((s) => {
      const u = s.users.find((x) => x.id === me.id);
      if (!u) throw new Error("ইউজার পাওয়া যায়নি");
      if (body.name?.trim()) u.name = body.name.trim();
      if (body.district && DISTRICTS.includes(body.district)) u.district = body.district;
      if (typeof body.upazila === "string") u.upazila = body.upazila.trim();
      if (typeof body.area === "string" && body.area.trim()) u.area = body.area.trim();
      if (typeof body.bio === "string") u.bio = body.bio.trim().slice(0, 400);
      if (Array.isArray(body.skills) && u.role === "worker") {
        const ids = new Set(storeCategories(s).map((c) => c.id));
        u.skills = body.skills.filter((id) => ids.has(id)).slice(0, 4);
      }
      if (typeof body.experienceYears === "number") u.experienceYears = Math.max(0, body.experienceYears);
      if (typeof body.hourlyRate === "number") u.hourlyRate = Math.max(0, body.hourlyRate);
      if (typeof body.jobRate === "number") u.jobRate = Math.max(0, body.jobRate);
      if (typeof body.available === "boolean") u.available = body.available;
      if (body.payout && u.role === "worker") {
        u.payout = {
          bankName: String(body.payout.bankName || u.payout.bankName || "").trim(),
          bankAccount: String(body.payout.bankAccount || u.payout.bankAccount || "").trim(),
          bankHolder: String(body.payout.bankHolder || u.payout.bankHolder || u.name).trim(),
          mobileBanking: String(body.payout.mobileBanking || u.payout.mobileBanking || "").trim(),
          mobileBankingType: (body.payout.mobileBankingType || u.payout.mobileBankingType || "") as MobileBankingType | "",
        };
      }
      if (u.role === "worker" && body.packageId && body.paymentRef) {
        const plan = s.packages.find((p) => p.id === String(body.packageId) && p.active);
        if (!plan) throw new Error("প্যাকেজ নেই");
        applyPackage(u, plan);
      }
    });
    const fresh = store.users.find((u) => u.id === me.id);
    if (!fresh) return fail("ইউজার পাওয়া যায়নি", 404);
    return ok({ user: toSessionUser(store, fresh) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Save failed");
  }
}
