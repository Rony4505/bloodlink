import { NextResponse } from "next/server";
import {
  hashCode,
  hashPassword,
  isAdminAuthenticated,
  verifyPassword,
} from "@/lib/auth";
import { getAdminSettings, updateAdminSettings } from "@/lib/db";
import { normalizePhone } from "@/lib/privacy";
import {
  adminCredentialsSchema,
  adminVerifyCodeSchema,
  adminVerifySetupSchema,
  platformOptionsSchema,
} from "@/lib/validations";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await getAdminSettings();
  return NextResponse.json({
    username: admin.username,
    verifyEmail: admin.verifyEmail,
    verifyPhone: admin.verifyPhone,
    emailVerified: admin.emailVerified,
    phoneVerified: admin.phoneVerified,
    privacyBn: admin.privacyBn,
    privacyEn: admin.privacyEn,
    platformOptions: admin.platformOptions,
  });
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "credentials") {
    const parsed = adminCredentialsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const admin = await getAdminSettings();
    const valid = await verifyPassword(
      parsed.data.currentPassword,
      admin.passwordHash,
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is wrong" },
        { status: 401 },
      );
    }

    const patch: {
      username?: string;
      passwordHash?: string;
    } = {};
    if (parsed.data.newUsername) patch.username = parsed.data.newUsername;
    if (parsed.data.newPassword) {
      patch.passwordHash = await hashPassword(parsed.data.newPassword);
    }
    if (!patch.username && !patch.passwordHash) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    await updateAdminSettings(patch);
    return NextResponse.json({ ok: true });
  }

  if (action === "verify-setup") {
    const parsed = adminVerifySetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact data" }, { status: 400 });
    }

    const email = parsed.data.email || "";
    const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";
    const emailCode = email ? makeCode() : null;
    const phoneCode = phone ? makeCode() : null;

    await updateAdminSettings({
      verifyEmail: email,
      verifyPhone: phone,
      emailVerified: email ? false : false,
      phoneVerified: phone ? false : false,
      pendingEmailCodeHash: emailCode ? hashCode(emailCode) : null,
      pendingPhoneCodeHash: phoneCode ? hashCode(phoneCode) : null,
    });

    // Local/dev delivery: return codes once so owner can verify without SMS/SMTP yet
    return NextResponse.json({
      ok: true,
      emailCode: emailCode || undefined,
      phoneCode: phoneCode || undefined,
      note: "Save these codes to complete verification. In production, send via email/SMS.",
    });
  }

  if (action === "verify-code") {
    const parsed = adminVerifyCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    const admin = await getAdminSettings();
    const hashed = hashCode(parsed.data.code);
    if (parsed.data.channel === "email") {
      if (!admin.pendingEmailCodeHash || admin.pendingEmailCodeHash !== hashed) {
        return NextResponse.json({ error: "Wrong email code" }, { status: 400 });
      }
      await updateAdminSettings({
        emailVerified: true,
        pendingEmailCodeHash: null,
      });
      return NextResponse.json({ ok: true, emailVerified: true });
    }

    if (!admin.pendingPhoneCodeHash || admin.pendingPhoneCodeHash !== hashed) {
      return NextResponse.json({ error: "Wrong phone code" }, { status: 400 });
    }
    await updateAdminSettings({
      phoneVerified: true,
      pendingPhoneCodeHash: null,
    });
    return NextResponse.json({ ok: true, phoneVerified: true });
  }

  if (action === "platform-options") {
    const parsed = platformOptionsSchema.safeParse(body.platformOptions);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid platform options" }, { status: 400 });
    }
    await updateAdminSettings({ platformOptions: parsed.data });
    return NextResponse.json({ ok: true, platformOptions: parsed.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
