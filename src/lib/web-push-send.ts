import webpush from "web-push";
import { randomUUID } from "crypto";
import {
  ensureVapidKeys,
  listPushSubscriptions,
  removePushSubscriptionByEndpoint,
} from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function getPublicVapidKey(): Promise<string> {
  const keys = await ensureVapidKeys();
  return keys.publicKey;
}

export async function sendWebPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return { sent: 0, failed: 0 };

  try {
    const keys = await ensureVapidKeys();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT?.trim() || "mailto:hello@bloodlinkbd.org",
      keys.publicKey,
      keys.privateKey,
    );

    const subs = (await listPushSubscriptions(unique)).filter(
      (s) => s.endpoint && !s.endpoint.startsWith("local-permission://"),
    );
    let sent = 0;
    let failed = 0;
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/notifications",
      tag: payload.tag || `bloodlink-${randomUUID().slice(0, 8)}`,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
          sent += 1;
        } catch (err: unknown) {
          failed += 1;
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await removePushSubscriptionByEndpoint(sub.endpoint).catch(
              () => undefined,
            );
          }
        }
      }),
    );

    return { sent, failed };
  } catch {
    return { sent: 0, failed: unique.length };
  }
}
