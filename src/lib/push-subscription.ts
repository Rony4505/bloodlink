import type { PushSubscriptionRecord } from "@/lib/types";

export const LOCAL_PUSH_PERMISSION_PREFIX = "local-permission://";

/**
 * Visitors who tap Allow without a donor account are stored under this
 * prefix so they still receive blood-request and announcement pushes.
 */
export const GUEST_PUSH_USER_PREFIX = "guest:";

export function guestPushUserId(guestId: string): string {
  return `${GUEST_PUSH_USER_PREFIX}${guestId}`;
}

export function isGuestPushUserId(userId: string): boolean {
  return userId.startsWith(GUEST_PUSH_USER_PREFIX);
}

export function isPermissionOnlyPushSubscription(
  sub: Pick<PushSubscriptionRecord, "endpoint">,
): boolean {
  return Boolean(sub.endpoint?.startsWith(LOCAL_PUSH_PERMISSION_PREFIX));
}

/** True when the server can deliver a real Web Push to this device. */
export function isDeliverablePushSubscription(
  sub: Pick<PushSubscriptionRecord, "endpoint">,
): boolean {
  return Boolean(sub.endpoint && !isPermissionOnlyPushSubscription(sub));
}

export type DonorPushStatus = "deliverable" | "permission_only" | "none";

export function donorPushStatusFromSubscriptions(
  subs: PushSubscriptionRecord[],
  userId: string,
): DonorPushStatus {
  const mine = subs.filter((s) => s.userId === userId);
  if (mine.some(isDeliverablePushSubscription)) return "deliverable";
  if (mine.some(isPermissionOnlyPushSubscription)) return "permission_only";
  return "none";
}
