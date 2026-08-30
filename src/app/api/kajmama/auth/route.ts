import { createUserSession, clearUserSession, getSessionUser, hashPassword, verifyPassword } from "@/lib/kajmama/auth";
import { DISTRICTS } from "@/lib/kajmama/constants";
import { fail, isValidBdPhone, newId, normalizePhone, ok } from "@/lib/kajmama/http";
import { applyPackage } from "@/lib/kajmama/premium";
import { toSessionUser } from "@/lib/kajmama/public";
import { findUserByPhone, readKajmamaStore, storeCategories, updateKajmamaStore } from "@/lib/kajmama/store";
import type { MobileBankingType, User, UserRole } from "@/lib/kajmama/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });
  const store = await readKajmamaStore();
  return ok({ user: toSessionUser(store, user) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      name?: string;
      phone?: string;
      password?: string;
      role?: UserRole;
      district?: string;
      upazila?: string;
      area?: string;
      skills?: string[];
      bio?: string;
      experienceYears?: number;
      hourlyRate?: number;
      jobRate?: number;
      packageId?: string;
      payout?: {
        bankName?: string;
        bankAccount?: string;
        bankHolder?: string;
        mobileBanking?: string;
        mobileBankingType?: MobileBankingType | "";
      };
    };

    if (body.action === "logout") {
      await clearUserSession();
      return ok({ ok: true });
    }

    if (body.action === "login") {
      const phone = normalizePhone(body.phone || "");
      const password = body.password || "";
      if (!phone || !password) return fail("ফোন ও পাসওয়ার্ড দিন");
      const store = await readKajmamaStore();
      const user = findUserByPhone(store, phone);
      if (!user || user.blocked) return fail("ফোন বা পাসওয়ার্ড সঠিক নয়", 401);
      const match = await verifyPassword(password, user.passwordHash);
      if (!match) return fail("ফোন বা পাসওয়ার্ড সঠিক নয়", 401);
      await createUserSession(user.id);
      return ok({ user: toSessionUser(store, user) });
    }

    if (body.action === "register") {
      const phone = normalizePhone(body.phone || "");
      const name = (body.name || "").trim();
      const password = body.password || "";
      const role: UserRole = body.role === "worker" ? "worker" : "hirer";
      const district = DISTRICTS.includes(body.district || "") ? body.district! : DISTRICTS[0];
      const area = (body.area || "").trim();
      const upazila = (body.upazila || "").trim() || area;
      if (!name) return fail("নাম লিখুন");
      if (!isValidBdPhone(phone)) return fail("সঠিক বাংলাদেশি মোবাইল দিন (01XXXXXXXXX)");
      if (password.length < 6) return fail("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর");
      if (!area) return fail("এলাকা লিখুন");
      if (role === "worker") {
        const bankName = (body.payout?.bankName || "").trim();
        const bankAccount = (body.payout?.bankAccount || "").trim();
        const mobileBanking = (body.payout?.mobileBanking || "").trim();
        if (!bankName || !bankAccount) return fail("ওয়ার্কারকে ব্যাংক নাম ও অ্যাকাউন্ট দিতে হবে");
        if (!mobileBanking) return fail("মোবাইল ব্যাংকিং নম্বর দিতে হবে");
      }

      const hashed = await hashPassword(password);
      let createdId = "";
      const store = await updateKajmamaStore((s) => {
        if (findUserByPhone(s, phone)) {
          throw new Error("এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে");
        }
        const skills =
          role === "worker"
            ? (body.skills || []).filter((id) => storeCategories(s).some((c) => c.id === id)).slice(0, 4)
            : [];
        const next: User = {
          id: newId("u"),
          name,
          phone,
          passwordHash: hashed,
          role,
          district,
          upazila,
          area,
          createdAt: new Date().toISOString(),
          bio: (body.bio || "").trim(),
          skills,
          experienceYears: role === "worker" ? Math.max(0, Number(body.experienceYears) || 0) : 0,
          hourlyRate: role === "worker" ? Math.max(0, Number(body.hourlyRate) || 0) : 0,
          jobRate: role === "worker" ? Math.max(0, Number(body.jobRate) || 0) : 0,
          verified: false,
          available: true,
          blocked: false,
          packageId: "basic",
          packageExpiresAt: null,
          payout: {
            bankName: (body.payout?.bankName || "").trim(),
            bankAccount: (body.payout?.bankAccount || "").trim(),
            bankHolder: (body.payout?.bankHolder || name).trim(),
            mobileBanking: (body.payout?.mobileBanking || "").trim(),
            mobileBankingType: (body.payout?.mobileBankingType || (role === "worker" ? "bkash" : "")) as MobileBankingType | "",
          },
        };
        if (role === "worker" && body.packageId && body.packageId !== "basic") {
          const plan = s.packages.find((p) => p.id === body.packageId && p.active);
          if (plan) applyPackage(next, plan);
        }
        s.users.push(next);
        createdId = next.id;
      });
      const fresh = store.users.find((u) => u.id === createdId);
      if (!fresh) return fail("অ্যাকাউন্ট তৈরি হয়নি", 500);
      await createUserSession(fresh.id);
      return ok({ user: toSessionUser(store, fresh) });
    }

    return fail("Unknown action");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Server error", 400);
  }
}
