import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findDonorByEmail, updateDonor } from "@/lib/db";
import {
  callbackUrl,
  clearSocialFlow,
  exchangeGoogleCode,
  isSocialProvider,
  readSocialFlow,
  requestOrigin,
  signSocialProfileToken,
  verifySocialIdToken,
} from "@/lib/social-auth";

export const dynamic = "force-dynamic";

type CallbackParams = {
  code: string;
  idToken: string;
  state: string;
  error: string;
  userName: string;
};

async function readParams(request: Request): Promise<CallbackParams> {
  const bag = new URLSearchParams();
  const url = new URL(request.url);
  url.searchParams.forEach((v, k) => bag.set(k, v));
  if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    form?.forEach((v, k) => {
      if (typeof v === "string") bag.set(k, v);
    });
  }
  // Apple sends `user` (JSON with name) only on the very first authorization.
  let userName = "";
  const rawUser = bag.get("user");
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser) as { name?: { firstName?: string; lastName?: string } };
      userName = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(" ").trim();
    } catch {
      /* ignore */
    }
  }
  return {
    code: bag.get("code") || "",
    idToken: bag.get("id_token") || "",
    state: bag.get("state") || "",
    error: bag.get("error") || "",
    userName,
  };
}

function fail(origin: string, reason: string) {
  return NextResponse.redirect(new URL(`/login?social_error=${encodeURIComponent(reason)}`, origin), 303);
}

async function handle(
  request: Request,
  params: Promise<{ provider: string }>,
) {
  const { provider } = await params;
  const origin = requestOrigin(request);
  if (!isSocialProvider(provider)) return fail(origin, "unavailable");

  const flow = await readSocialFlow();
  await clearSocialFlow();
  const p = await readParams(request);

  if (p.error) return fail(origin, p.error === "user_cancelled_authorize" ? "cancelled" : p.error);
  if (!flow || flow.provider !== provider || !p.state || p.state !== flow.state) {
    return fail(origin, "state");
  }

  try {
    const idToken =
      provider === "google"
        ? await exchangeGoogleCode(p.code, callbackUrl(origin, provider))
        : p.idToken;
    if (!idToken) return fail(origin, "token");

    const profile = await verifySocialIdToken(provider, idToken, flow.nonce, p.userName);
    if (!profile.emailVerified) return fail(origin, "email_unverified");

    const existing = await findDonorByEmail(profile.email);
    if (existing) {
      await createSession(existing.id);
      if (!existing.emailVerified) {
        await updateDonor(existing.id, { emailVerified: true });
      }
      const dest = flow.next || "/dashboard";
      return NextResponse.redirect(new URL(`${dest}${dest.includes("?") ? "&" : "?"}social=1`, origin), 303);
    }

    const token = await signSocialProfileToken(profile);
    return NextResponse.redirect(new URL(`/register?social=${encodeURIComponent(token)}`, origin), 303);
  } catch (err) {
    console.error(`[bloodlink] social login (${provider}) failed:`, err);
    return fail(origin, "verify");
  }
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  return handle(request, ctx.params);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  return handle(request, ctx.params);
}
