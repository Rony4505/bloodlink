import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { guestPushUserId } from "./push-subscription";

const GUEST_COOKIE = "bloodlink_guest_push";
const GUEST_COOKIE_DAYS = 365;
const GUEST_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

/**
 * Stable per-browser id for push subscriptions made without a donor login.
 * Creates the cookie on first use so Allow works for every visitor.
 */
export async function getOrCreateGuestPushUserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value?.trim();
  if (existing && GUEST_ID_RE.test(existing)) {
    return guestPushUserId(existing);
  }
  const id = randomUUID();
  jar.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_DAYS * 24 * 60 * 60,
  });
  return guestPushUserId(id);
}

/** Read-only lookup — null when this browser has no guest id yet. */
export async function getGuestPushUserId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value?.trim();
  if (existing && GUEST_ID_RE.test(existing)) {
    return guestPushUserId(existing);
  }
  return null;
}
