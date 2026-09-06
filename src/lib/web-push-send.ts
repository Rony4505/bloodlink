import webpush from "web-push";
import { randomUUID } from "crypto";
import {
  ensureVapidKeys,
  listPushSubscriptions,
  listAllDeliverablePushUserIds,
  removePushSubscriptionByEndpoint,
} from "@/lib/db";
import { isDeliverablePushSubscription } from "@/lib/push-subscription";

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

async function sendToSubscriptions(
  subs: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!subs.length) return { sent: 0, failed: 0 };

  const keys = await ensureVapidKeys();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:bdbloodlink@gmail.com",
    keys.publicKey,
    keys.privateKey,
  );

  // Deduplicate by endpoint (admin + donor on same phone).
  const byEndpoint = new Map<string, (typeof subs)[number]>();
  for (const sub of subs) {
    if (!byEndpoint.has(sub.endpoint)) byEndpoint.set(sub.endpoint, sub);
  }
  const uniqueSubs = [...byEndpoint.values()];

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/notifications",
    tag: payload.tag || `bloodlink-${randomUUID().slice(0, 8)}`,
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    uniqueSubs.map(async (sub) => {
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
        console.error(
          `[bloodlink-push] send failed status=${status ?? "?"} endpoint=${sub.endpoint.slice(0, 48)}…`,
          err instanceof Error ? err.message : err,
        );
        if (status === 404 || status === 410) {
          await removePushSubscriptionByEndpoint(sub.endpoint).catch(
            () => undefined,
          );
        }
      }
    }),
  );

  console.info(
    `[bloodlink-push] delivered sent=${sent} failed=${failed} targets=${uniqueSubs.length} tag=${payload.tag || ""}`,
  );
  return { sent, failed };
}

export async function sendWebPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return { sent: 0, failed: 0 };

  try {
    const subs = (await listPushSubscriptions(unique)).filter(
      isDeliverablePushSubscription,
    );
    return await sendToSubscriptions(subs, payload);
  } catch (err) {
    console.error("[bloodlink-push] sendWebPushToUsers fatal:", err);
    return { sent: 0, failed: unique.length };
  }
}

/** Send to every deliverable subscription (donors + admin + volunteers). */
export async function sendWebPushToAllDeliverable(
  payload: PushPayload,
): Promise<{ sent: number; failed: number; userCount: number }> {
  try {
    const userIds = await listAllDeliverablePushUserIds();
    const result = await sendWebPushToUsers(userIds, payload);
    return { ...result, userCount: userIds.length };
  } catch (err) {
    console.error("[bloodlink-push] broadcast fatal:", err);
    return { sent: 0, failed: 0, userCount: 0 };
  }
}
