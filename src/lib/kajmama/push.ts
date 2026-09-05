import webpush from "web-push";
import { readKajmamaStore, updateKajmamaStore } from "./store";

export async function ensureKajmamaVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const store = await readKajmamaStore();
  if (store.settings.vapidPublicKey && store.settings.vapidPrivateKey) {
    return { publicKey: store.settings.vapidPublicKey, privateKey: store.settings.vapidPrivateKey };
  }
  const keys = webpush.generateVAPIDKeys();
  await updateKajmamaStore((s) => {
    s.settings.vapidPublicKey = keys.publicKey;
    s.settings.vapidPrivateKey = keys.privateKey;
  });
  return keys;
}

export async function sendKajmamaPush(
  userIds: string[],
  payload: { title: string; body: string; url: string; tag?: string },
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  try {
    const keys = await ensureKajmamaVapid();
    webpush.setVapidDetails("mailto:support@kajmamabd.com", keys.publicKey, keys.privateKey);
    const store = await readKajmamaStore();
    const subs = store.pushSubs.filter((s) => unique.includes(s.userId) && s.endpoint && !s.endpoint.startsWith("local-"));
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag || "kajmama",
    });
    const dead: string[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) dead.push(sub.id);
        }
      }),
    );
    if (dead.length) {
      await updateKajmamaStore((s) => {
        s.pushSubs = s.pushSubs.filter((p) => !dead.includes(p.id));
      });
    }
  } catch {
    /* push is best-effort */
  }
}
