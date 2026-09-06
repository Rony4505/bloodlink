import { NextResponse } from "next/server";
import {
  createAdminSession,
  hashCode,
  hashPassword,
  makeCode,
} from "@/lib/auth";
import { getAdminSettings, updateAdminSettings } from "@/lib/db";
import {
  getAdminRecoveryEmail,
  maskEmail,
} from "@/lib/admin-recovery";
import { deliverEmailOtp } from "@/lib/otp-delivery";
import { z } from "zod";

const RESET_TTL_MS = 15 * 60 * 1000;

const confirmSchema = z.object({
  code: z.string().trim().min(4).max(10),
  newUsername: z.string().trim().min(3).max(80),
  newPassword: z.string().min(8).max(72),
});

const verifySchema = z.object({
  code: z.string().trim().min(4).max(10),
});

function verifiedAdminResetHash(expiresAt: string): string {
  return hashCode(`admin-reset-verified:${expiresAt}`);
}

function clearAdminResetFields() {
  return {
    pendingResetCodeHash: null as string | null,
    pendingResetExpiresAt: null as string | null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || "send");

    if (action === "verify") return verifyResetOtp(body);
    if (action === "confirm") return confirmReset(body);
    return sendResetOtp();
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendResetOtp() {
  const email = getAdminRecoveryEmail();
  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Admin recovery Gmail is not configured." },
      { status: 503 },
    );
  }

  const code = makeCode();
  const delivery = await deliverEmailOtp(email, code, { allowInline: false });
  if (!delivery.delivered || delivery.mode !== "email") {
    const detail = delivery.detail || "";
    const missingKey = detail.toLowerCase().includes("resend_api_key");
    return NextResponse.json(
      {
        error: missingKey
          ? "Could not send Gmail OTP. RESEND_API_KEY is not set on the server."
          : `Could not send Gmail OTP. ${detail}`,
        detail,
      },
      { status: 503 },
    );
  }

  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  await updateAdminSettings({
    pendingResetCodeHash: hashCode(code),
    pendingResetExpiresAt: expiresAt,
  });

  return NextResponse.json({
    ok: true,
    emailMasked: maskEmail(email),
    expiresInMinutes: 15,
  });
}

async function loadActiveAdminReset() {
  const admin = await getAdminSettings();
  if (!admin.pendingResetCodeHash || !admin.pendingResetExpiresAt) {
    return { admin, active: false as const, expired: false as const };
  }
  if (new Date(admin.pendingResetExpiresAt).getTime() < Date.now()) {
    await updateAdminSettings(clearAdminResetFields());
    return { admin, active: false as const, expired: true as const };
  }
  return { admin, active: true as const, expired: false as const };
}

async function verifyResetOtp(body: unknown) {
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  const { admin, active, expired } = await loadActiveAdminReset();
  if (expired) {
    return NextResponse.json(
      { error: "OTP expired. Request a new code." },
      { status: 410 },
    );
  }
  if (!active) {
    return NextResponse.json(
      { error: "Reset expired. Request a new Gmail OTP." },
      { status: 410 },
    );
  }

  if (hashCode(parsed.data.code) !== admin.pendingResetCodeHash) {
    return NextResponse.json(
      { error: "Incorrect verification code. Use the latest Gmail OTP." },
      { status: 400 },
    );
  }

  await updateAdminSettings({
    pendingResetCodeHash: verifiedAdminResetHash(admin.pendingResetExpiresAt!),
    pendingResetExpiresAt: admin.pendingResetExpiresAt,
  });

  return NextResponse.json({ ok: true, verified: true });
}

async function confirmReset(body: unknown) {
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Username (min 3) and password (min 8) required after OTP verify.",
      },
      { status: 400 },
    );
  }

  const { admin, active, expired } = await loadActiveAdminReset();
  if (expired) {
    return NextResponse.json(
      { error: "OTP expired. Request a new code." },
      { status: 410 },
    );
  }
  if (!active) {
    return NextResponse.json(
      { error: "Reset expired. Request a new Gmail OTP." },
      { status: 410 },
    );
  }

  if (
    admin.pendingResetCodeHash !==
    verifiedAdminResetHash(admin.pendingResetExpiresAt!)
  ) {
    return NextResponse.json(
      { error: "Verify Gmail OTP before setting new credentials." },
      { status: 400 },
    );
  }

  const username = parsed.data.newUsername.trim().toLowerCase();
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await updateAdminSettings({
    username,
    passwordHash,
    ...clearAdminResetFields(),
  });

  await createAdminSession();

  return NextResponse.json({ ok: true, username });
}
