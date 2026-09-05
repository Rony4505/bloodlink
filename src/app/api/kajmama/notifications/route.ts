import { getSessionUser } from "@/lib/kajmama/auth";
import { fail, newId, ok } from "@/lib/kajmama/http";
import { ensureKajmamaVapid } from "@/lib/kajmama/push";
import { readKajmamaStore, updateKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  const keys = await ensureKajmamaVapid();
  const store = await readKajmamaStore();
  const notifications = store.notifications
    .filter((n) => n.userId === me.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 40);
  return ok({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    vapidPublicKey: keys.publicKey,
    pushOn: store.pushSubs.some((s) => s.userId === me.id),
  });
}

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return fail("লগইন করুন", 401);
  const body = (await request.json()) as {
    action?: string;
    id?: string;
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    permissionOnly?: boolean;
  };

  try {
    if (body.action === "read" && body.id) {
      await updateKajmamaStore((s) => {
        const n = s.notifications.find((x) => x.id === body.id && x.userId === me.id);
        if (n) n.read = true;
      });
      return ok({ ok: true });
    }
    if (body.action === "readAll") {
      await updateKajmamaStore((s) => {
        s.notifications.forEach((n) => {
          if (n.userId === me.id) n.read = true;
        });
      });
      return ok({ ok: true });
    }
    if (body.action === "subscribe") {
      if (body.permissionOnly) {
        await updateKajmamaStore((s) => {
          const marker = `local-${me.id}`;
          if (!s.pushSubs.some((p) => p.userId === me.id && p.endpoint.startsWith("local-"))) {
            s.pushSubs.push({
              id: newId("ps"),
              userId: me.id,
              endpoint: marker,
              p256dh: "",
              auth: "",
              createdAt: new Date().toISOString(),
            });
          }
        });
        return ok({ ok: true });
      }
      const endpoint = (body.endpoint || "").trim();
      const p256dh = (body.keys?.p256dh || "").trim();
      const auth = (body.keys?.auth || "").trim();
      if (!endpoint || !p256dh || !auth) return fail("সাবস্ক্রিপশন অসম্পূর্ণ");
      await updateKajmamaStore((s) => {
        s.pushSubs = s.pushSubs.filter((p) => p.endpoint !== endpoint);
        s.pushSubs.push({
          id: newId("ps"),
          userId: me.id,
          endpoint,
          p256dh,
          auth,
          createdAt: new Date().toISOString(),
        });
      });
      return ok({ ok: true });
    }
    if (body.action === "unsubscribe") {
      await updateKajmamaStore((s) => {
        s.pushSubs = s.pushSubs.filter((p) => p.userId !== me.id);
      });
      return ok({ ok: true });
    }
    return fail("Unknown action");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "আপডেট হয়নি");
  }
}
