import { randomBytes } from "crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSiteUrl } from "./site";

/**
 * "Continue with Google / Apple" for donors.
 *
 * Google → OpenID Connect authorization-code flow (needs client id + secret).
 * Apple  → Sign in with Apple, `response_mode=form_post` returning `id_token`
 *          directly (needs only the Services ID as client id).
 *
 * Both end in a verified email. Existing donor → session. New visitor → a
 * short-lived profile token that pre-fills /register (no password, no OTP).
 */

export type SocialProvider = "google" | "apple";

export type SocialProfile = {
  provider: SocialProvider;
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

const STATE_COOKIE = "bloodlink_oauth";
const STATE_TTL_SEC = 10 * 60;
const PROFILE_TTL_SEC = 30 * 60;

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export function isSocialProvider(value: string): value is SocialProvider {
  return value === "google" || value === "apple";
}

export function socialProviderAvailability(): Record<SocialProvider, boolean> {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(process.env.APPLE_CLIENT_ID),
  };
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET must be set (min 16 characters)");
  return new TextEncoder().encode(s);
}

/** Public origin for redirect URIs — request origin, but never a Railway host. */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const origin = `${proto}://${host}`;
  if (/railway\.app|railway\.internal/.test(origin)) return getSiteUrl();
  return origin;
}

export function callbackUrl(origin: string, provider: SocialProvider): string {
  return `${origin}/api/auth/social/${provider}/callback`;
}

/** Store CSRF state + nonce for the round-trip. Apple posts back cross-site → SameSite=None. */
export async function beginSocialFlow(
  provider: SocialProvider,
  origin: string,
  next: string,
): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const nonce = randomBytes(16).toString("hex");
  const jar = await cookies();
  const secure = origin.startsWith("https://");
  jar.set(STATE_COOKIE, JSON.stringify({ state, nonce, provider, next }), {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: STATE_TTL_SEC,
  });

  const redirectUri = callbackUrl(origin, provider);
  if (provider === "google") {
    const p = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      prompt: "select_account",
      access_type: "online",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
  }
  const p = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state,
    nonce,
  });
  return `https://appleid.apple.com/auth/authorize?${p.toString()}`;
}

export async function readSocialFlow(): Promise<{
  state: string;
  nonce: string;
  provider: SocialProvider;
  next: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      state?: string;
      nonce?: string;
      provider?: string;
      next?: string;
    };
    if (!parsed.state || !parsed.nonce || !parsed.provider || !isSocialProvider(parsed.provider)) {
      return null;
    }
    return {
      state: parsed.state,
      nonce: parsed.nonce,
      provider: parsed.provider,
      next: typeof parsed.next === "string" ? parsed.next : "",
    };
  } catch {
    return null;
  }
}

export async function clearSocialFlow(): Promise<void> {
  const jar = await cookies();
  jar.delete(STATE_COOKIE);
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !data.id_token) {
    throw new Error(`Google token exchange failed: ${data.error || res.status}`);
  }
  return data.id_token;
}

/** Verify a provider ID token and return the normalized profile. */
export async function verifySocialIdToken(
  provider: SocialProvider,
  idToken: string,
  nonce: string,
  fallbackName?: string,
): Promise<SocialProfile> {
  const { payload } =
    provider === "google"
      ? await jwtVerify(idToken, googleJwks, {
          issuer: ["https://accounts.google.com", "accounts.google.com"],
          audience: process.env.GOOGLE_CLIENT_ID || "",
        })
      : await jwtVerify(idToken, appleJwks, {
          issuer: "https://appleid.apple.com",
          audience: process.env.APPLE_CLIENT_ID || "",
        });

  if (payload.nonce !== nonce) throw new Error("Nonce mismatch");
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email) throw new Error("Provider did not return an email");
  const verifiedRaw = payload.email_verified;
  const emailVerified =
    verifiedRaw === true || verifiedRaw === "true" || (provider === "apple" && verifiedRaw == null);
  const name =
    (typeof payload.name === "string" && payload.name.trim()) ||
    (fallbackName || "").trim() ||
    email.split("@")[0];

  return {
    provider,
    sub: String(payload.sub || ""),
    email,
    emailVerified,
    name: name.slice(0, 80),
  };
}

/** Hand the verified profile to /register without a DB round-trip. */
export async function signSocialProfileToken(profile: SocialProfile): Promise<string> {
  return new SignJWT({
    purpose: "social-profile",
    provider: profile.provider,
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PROFILE_TTL_SEC}s`)
    .sign(secret());
}

export async function verifySocialProfileToken(token: string): Promise<SocialProfile | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "social-profile") return null;
    const provider = String(payload.provider || "");
    if (!isSocialProvider(provider)) return null;
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) return null;
    return {
      provider,
      sub: String(payload.sub || ""),
      email,
      emailVerified: true,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
