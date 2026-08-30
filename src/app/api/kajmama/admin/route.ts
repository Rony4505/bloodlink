import {
  clearAdminSession,
  createAdminSession,
  isKajmamaAdmin,
} from "@/lib/kajmama/auth";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { applyPackage } from "@/lib/kajmama/premium";
import { toPublicUser } from "@/lib/kajmama/public";
import { findBooking, findUser, readKajmamaStore, setWorkerAvailability, storeCategories, updateKajmamaStore } from "@/lib/kajmama/store";
import type { AdPlacement, Advertisement, MobileBankingType, PackagePlan } from "@/lib/kajmama/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);
  const store = await readKajmamaStore();
  return ok({
    stats: {
      users: store.users.length,
      workers: store.users.filter((u) => u.role === "worker").length,
      hirers: store.users.filter((u) => u.role === "hirer").length,
      jobs: store.jobs.length,
      bookings: store.bookings.length,
      paid: store.bookings.filter((b) => b.status === "paid").length,
      pendingPay: store.bookings.filter((b) => b.status === "completed").length,
      completed: store.bookings.filter((b) => b.status === "paid" || b.status === "completed").length,
      feeCollected: store.bookings.filter((b) => b.status === "paid").reduce((a, b) => a + (b.siteFee || 0), 0),
    },
    settings: store.settings,
    packages: store.packages,
    categories: storeCategories(store),
    ads: store.ads,
    workers: store.users
      .filter((u) => u.role === "worker")
      .map((u) => ({
        ...toPublicUser(store, u, { revealPhone: true }),
        phone: u.phone,
        blocked: u.blocked,
        payout: u.payout,
      })),
    hirers: store.users
      .filter((u) => u.role === "hirer")
      .map((u) => ({
        ...toPublicUser(store, u, { revealPhone: true }),
        phone: u.phone,
        blocked: u.blocked,
      })),
    jobs: store.jobs,
    bookings: store.bookings.map((b) => {
      const worker = findUser(store, b.workerId);
      const hirer = findUser(store, b.hirerId);
      return {
        ...b,
        workerName: worker?.name,
        hirerName: hirer?.name,
      };
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "login") {
      const store = await readKajmamaStore();
      if (String(body.pin || "").trim() !== store.settings.ownerPin) {
        return fail("পিন সঠিক নয়", 401);
      }
      await createAdminSession();
      return ok({ ok: true });
    }

    if (action === "logout") {
      await clearAdminSession();
      return ok({ ok: true });
    }

    if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);

    if (action === "verify" && body.userId) {
      await updateKajmamaStore((s) => {
        const u = findUser(s, String(body.userId));
        if (!u) throw new Error("ইউজার নেই");
        u.verified = body.verified !== false;
      });
      return ok({ ok: true });
    }

    if (action === "block" && body.userId) {
      await updateKajmamaStore((s) => {
        const u = findUser(s, String(body.userId));
        if (!u) throw new Error("ইউজার নেই");
        u.blocked = !!body.blocked;
      });
      return ok({ ok: true });
    }

    if (action === "saveSettings") {
      await updateKajmamaStore((s) => {
        const pct = Number(body.commissionPct);
        if (Number.isFinite(pct)) s.settings.commissionPct = Math.min(40, Math.max(0, pct));
        if (typeof body.contactPhone === "string") s.settings.contactPhone = body.contactPhone.trim();
        if (typeof body.contactEmail === "string") s.settings.contactEmail = body.contactEmail.trim();
        if (typeof body.contactWhatsapp === "string") s.settings.contactWhatsapp = body.contactWhatsapp.trim();
        if (typeof body.contactFacebook === "string") s.settings.contactFacebook = body.contactFacebook.trim();
        if (Array.isArray(body.banks)) {
          s.settings.banks = body.banks as typeof s.settings.banks;
        }
        if (Array.isArray(body.mobiles)) {
          s.settings.mobiles = body.mobiles as typeof s.settings.mobiles;
        }
      });
      return ok({ ok: true });
    }

    if (action === "savePackage") {
      const pkg = body.pkg as Partial<PackagePlan>;
      if (!pkg) return fail("প্যাকেজ দিন");
      await updateKajmamaStore((s) => {
        const id = pkg.id || newId("pkg");
        const next: PackagePlan = {
          id,
          nameBn: String(pkg.nameBn || "প্যাকেজ").trim(),
          nameEn: String(pkg.nameEn || "Package").trim(),
          price: Math.max(0, Number(pkg.price) || 0),
          durationDays: Math.max(0, Number(pkg.durationDays) || 0),
          premium: !!pkg.premium,
          featuresBn: Array.isArray(pkg.featuresBn) ? pkg.featuresBn.map(String) : [],
          featuresEn: Array.isArray(pkg.featuresEn) ? pkg.featuresEn.map(String) : [],
          active: pkg.active !== false,
        };
        const i = s.packages.findIndex((p) => p.id === id);
        if (i >= 0) s.packages[i] = next;
        else s.packages.push(next);
      });
      return ok({ ok: true });
    }

    if (action === "deletePackage" && body.packageId) {
      const id = String(body.packageId);
      if (id === "basic") return fail("বেসিক প্যাকেজ মুছা যায় না");
      await updateKajmamaStore((s) => {
        s.packages = s.packages.filter((p) => p.id !== id);
        s.users.forEach((u) => {
          if (u.packageId === id) {
            u.packageId = "basic";
            u.packageExpiresAt = null;
          }
        });
      });
      return ok({ ok: true });
    }

    if (action === "setPackage" && body.userId && body.packageId) {
      await updateKajmamaStore((s) => {
        const u = findUser(s, String(body.userId));
        if (!u || u.role !== "worker") throw new Error("ওয়ার্কার নেই");
        const plan = s.packages.find((p) => p.id === String(body.packageId));
        if (!plan) throw new Error("প্যাকেজ নেই");
        applyPackage(u, plan);
      });
      return ok({ ok: true });
    }

    if (action === "addCategory") {
      const nameBn = String(body.nameBn || "").trim();
      const nameEn = String(body.nameEn || "").trim();
      if (!nameBn || !nameEn) return fail("বাংলা ও ইংরেজি নাম দিন");
      await updateKajmamaStore((s) => {
        const slug =
          nameEn
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || newId("cat");
        if (s.categories.some((c) => c.id === slug || c.nameBn === nameBn)) {
          throw new Error("এই ক্যাটাগরি আগে থেকে আছে");
        }
        s.categories.push({
          id: slug,
          nameBn,
          nameEn,
          blurbBn: String(body.blurbBn || "").trim(),
          blurbEn: String(body.blurbEn || "").trim(),
          icon: String(body.icon || "🛠️").trim() || "🛠️",
        });
      });
      return ok({ ok: true });
    }

    if (action === "saveAd") {
      const ad = body.ad as Partial<Advertisement>;
      if (!ad) return fail("বিজ্ঞাপন দিন");
      await updateKajmamaStore((s) => {
        const id = ad.id || newId("ad");
        const next: Advertisement = {
          id,
          title: String(ad.title || "বিজ্ঞাপন").trim(),
          subtitle: String(ad.subtitle || "").trim(),
          imageUrl: String(ad.imageUrl || "").trim(),
          href: String(ad.href || "/kajmama").trim(),
          ctaBn: String(ad.ctaBn || "দেখুন").trim(),
          ctaEn: String(ad.ctaEn || "View").trim(),
          placement: (ad.placement || "all_pages") as AdPlacement,
          active: ad.active !== false,
        };
        const i = s.ads.findIndex((a) => a.id === id);
        if (i >= 0) s.ads[i] = next;
        else s.ads.push(next);
      });
      return ok({ ok: true });
    }

    if (action === "deleteAd" && body.adId) {
      await updateKajmamaStore((s) => {
        s.ads = s.ads.filter((a) => a.id !== String(body.adId));
      });
      return ok({ ok: true });
    }

    if (action === "markPaid" && body.bookingId) {
      await updateKajmamaStore((s) => {
        const b = findBooking(s, String(body.bookingId));
        if (!b) throw new Error("বুকিং নেই");
        if (b.status !== "completed") throw new Error("আগে কাজ শেষ হতে হবে");
        const now = new Date().toISOString();
        b.status = "paid";
        b.paidAt = now;
        b.paymentMethod = String(body.paymentMethod || "admin");
        b.paymentRef = String(body.paymentRef || "ADMIN");
        b.updatedAt = now;
        setWorkerAvailability(s, b.workerId);
      });
      return ok({ ok: true });
    }

    if (action === "addBank") {
      await updateKajmamaStore((s) => {
        s.settings.banks.push({
          id: newId("bank"),
          bankName: String(body.bankName || "").trim(),
          accountName: String(body.accountName || "").trim(),
          accountNumber: String(body.accountNumber || "").trim(),
          branch: String(body.branch || "").trim(),
        });
      });
      return ok({ ok: true });
    }

    if (action === "addMobile") {
      await updateKajmamaStore((s) => {
        s.settings.mobiles.push({
          id: newId("mob"),
          type: (String(body.type || "bkash") as MobileBankingType) || "bkash",
          number: String(body.number || "").trim(),
          name: String(body.name || "KajMama BD").trim(),
        });
      });
      return ok({ ok: true });
    }

    if (action === "removePay") {
      await updateKajmamaStore((s) => {
        const id = String(body.id || "");
        s.settings.banks = s.settings.banks.filter((b) => b.id !== id);
        s.settings.mobiles = s.settings.mobiles.filter((m) => m.id !== id);
      });
      return ok({ ok: true });
    }

    return fail("Unknown action");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Admin error");
  }
}
