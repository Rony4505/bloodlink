import {
  clearAdminSession,
  createAdminSession,
  isKajmamaAdmin,
} from "@/lib/kajmama/auth";
import { fail, ok } from "@/lib/kajmama/http";
import { toPublicUser } from "@/lib/kajmama/public";
import { findUser, readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);
  const store = await readKajmamaStore();
  return ok({
    stats: {
      users: store.users.length,
      workers: store.users.filter((u) => u.role === "worker").length,
      jobs: store.jobs.length,
      bookings: store.bookings.length,
      completed: store.bookings.filter((b) => b.status === "completed").length,
    },
    users: store.users.map((u) => ({
      ...toPublicUser(store, u),
      phone: u.phone,
      blocked: u.blocked,
    })),
    jobs: store.jobs.slice(0, 40),
    bookings: store.bookings.slice(0, 40),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      pin?: string;
      userId?: string;
      verified?: boolean;
      blocked?: boolean;
    };

    if (body.action === "login") {
      const store = await readKajmamaStore();
      if ((body.pin || "").trim() !== store.settings.ownerPin) {
        return fail("পিন সঠিক নয়", 401);
      }
      await createAdminSession();
      return ok({ ok: true });
    }

    if (body.action === "logout") {
      await clearAdminSession();
      return ok({ ok: true });
    }

    if (!(await isKajmamaAdmin())) return fail("অ্যাডমিন লগইন করুন", 401);

    if (body.action === "verify" && body.userId) {
      await updateKajmamaStore((s) => {
        const u = findUser(s, body.userId!);
        if (!u) throw new Error("ইউজার নেই");
        u.verified = body.verified !== false;
      });
      return ok({ ok: true });
    }

    if (body.action === "block" && body.userId) {
      await updateKajmamaStore((s) => {
        const u = findUser(s, body.userId!);
        if (!u) throw new Error("ইউজার নেই");
        u.blocked = !!body.blocked;
      });
      return ok({ ok: true });
    }

    return fail("Unknown action");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Admin error");
  }
}
