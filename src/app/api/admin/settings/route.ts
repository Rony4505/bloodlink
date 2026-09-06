import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  hashCode,
  hashPassword,
  isAdminAuthenticated,
  makeCode,
  verifyPassword,
} from "@/lib/auth";
import {
  getAdminSettings,
  updateAdminSettings,
  broadcastSystemAnnouncement,
  countPushAllowStats,
} from "@/lib/db";
import { getAdminRecoveryEmail, maskEmail } from "@/lib/admin-recovery";
import { deliverEmailOtp } from "@/lib/otp-delivery";
import { normalizeNotificationSettings } from "@/lib/notification-settings";
import {
  normalizeBanner,
  normalizeBannerSlideIntervalSec,
  normalizeSiteAppearance,
} from "@/lib/site-cms";
import {
  notificationBroadcastSchema,
  notificationSettingsSchema,
  platformOptionsSchema,
} from "@/lib/validations";
import type { OrgBanner } from "@/lib/types";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await getAdminSettings();
  const pushAllow = await countPushAllowStats();
  return NextResponse.json({
    username: admin.username,
    verifyEmail: getAdminRecoveryEmail(admin.verifyEmail),
    recoveryEmail: getAdminRecoveryEmail(admin.verifyEmail),
    pendingVerifyEmail: admin.pendingVerifyEmail || "",
    verifyPhone: "",
    emailVerified: admin.emailVerified,
    phoneVerified: false,
    privacyBn: admin.privacyBn,
    privacyEn: admin.privacyEn,
    platformOptions: admin.platformOptions,
    notificationSettings: normalizeNotificationSettings(admin.notificationSettings),
    pushAllow,
    banners: admin.banners || [],
    bannerSlideIntervalSec: normalizeBannerSlideIntervalSec(admin.bannerSlideIntervalSec),
    siteAppearance: normalizeSiteAppearance(admin.siteAppearance),
  });
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;


  if (action === "security-save-gmail") {
    const email = String(body.email || "").trim().toLowerCase();
    const currentPassword = String(body.currentPassword || "");
    if (!email.includes("@") || !currentPassword) {
      return NextResponse.json(
        { error: "Gmail and present password are required." },
        { status: 400 },
      );
    }
    const admin = await getAdminSettings();
    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Present password is wrong." },
        { status: 401 },
      );
    }
    const code = makeCode();
    const delivery = await deliverEmailOtp(email, code, { allowInline: false });
    if (!delivery.delivered || delivery.mode !== "email") {
      const detail = delivery.detail || "";
      return NextResponse.json(
        {
          error: detail.toLowerCase().includes("resend_api_key")
            ? "Could not send Gmail OTP. RESEND_API_KEY is not set."
            : `Could not send Gmail OTP. ${detail}`,
          detail,
        },
        { status: 503 },
      );
    }
    await updateAdminSettings({
      pendingVerifyEmail: email,
      pendingEmailCodeHash: hashCode(`security-gmail:${code}`),
    });
    return NextResponse.json({
      ok: true,
      purpose: "gmail",
      emailMasked: maskEmail(email),
      expiresInMinutes: 15,
    });
  }

  if (action === "security-confirm-gmail") {
    const code = String(body.code || "").trim();
    const currentPassword = String(body.currentPassword || "");
    if (!code || !currentPassword) {
      return NextResponse.json(
        { error: "Present password and OTP are required." },
        { status: 400 },
      );
    }
    const admin = await getAdminSettings();
    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Present password is wrong." },
        { status: 401 },
      );
    }
    if (!admin.pendingVerifyEmail || !admin.pendingEmailCodeHash) {
      return NextResponse.json(
        { error: "No pending Gmail change. Save Gmail / send OTP first." },
        { status: 410 },
      );
    }
    if (hashCode(`security-gmail:${code}`) !== admin.pendingEmailCodeHash) {
      return NextResponse.json(
        { error: "Incorrect verification code." },
        { status: 400 },
      );
    }
    const email = admin.pendingVerifyEmail.trim().toLowerCase();
    await updateAdminSettings({
      verifyEmail: email,
      emailVerified: true,
      pendingVerifyEmail: null,
      pendingEmailCodeHash: null,
      verifyPhone: "",
      phoneVerified: false,
    });
    return NextResponse.json({
      ok: true,
      emailVerified: true,
      verifyEmail: email,
    });
  }

  if (action === "security-send-otp") {
    const currentPassword = String(body.currentPassword || "");
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Present password is required to send OTP." },
        { status: 400 },
      );
    }
    const admin = await getAdminSettings();
    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Present password is wrong." },
        { status: 401 },
      );
    }
    const email = getAdminRecoveryEmail(admin.verifyEmail);
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Set a recovery Gmail in Security first." },
        { status: 400 },
      );
    }
    const code = makeCode();
    const delivery = await deliverEmailOtp(email, code, { allowInline: false });
    if (!delivery.delivered || delivery.mode !== "email") {
      const detail = delivery.detail || "";
      return NextResponse.json(
        {
          error: detail.toLowerCase().includes("resend_api_key")
            ? "Could not send Gmail OTP. RESEND_API_KEY is not set."
            : `Could not send Gmail OTP. ${detail}`,
          detail,
        },
        { status: 503 },
      );
    }
    await updateAdminSettings({
      pendingEmailCodeHash: hashCode(`security-cred:${code}`),
      pendingVerifyEmail: null,
    });
    return NextResponse.json({
      ok: true,
      purpose: "credentials",
      emailMasked: maskEmail(email),
      expiresInMinutes: 15,
    });
  }

  if (action === "security-update-credentials") {
    const currentPassword = String(body.currentPassword || "");
    const code = String(body.code || "").trim();
    const newUsername = String(body.newUsername || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!currentPassword || !code) {
      return NextResponse.json(
        { error: "Present password and OTP are required." },
        { status: 400 },
      );
    }
    if (!newUsername && !newPassword) {
      return NextResponse.json(
        { error: "Enter a new username and/or new password." },
        { status: 400 },
      );
    }
    if (newUsername && newUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }
    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }
    const admin = await getAdminSettings();
    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Present password is wrong." },
        { status: 401 },
      );
    }
    if (
      !admin.pendingEmailCodeHash ||
      hashCode(`security-cred:${code}`) !== admin.pendingEmailCodeHash
    ) {
      return NextResponse.json(
        { error: "Incorrect or expired OTP. Tap Send OTP again." },
        { status: 400 },
      );
    }
    const patch: {
      username?: string;
      passwordHash?: string;
      pendingEmailCodeHash: null;
    } = { pendingEmailCodeHash: null };
    if (newUsername) patch.username = newUsername.toLowerCase();
    if (newPassword) patch.passwordHash = await hashPassword(newPassword);
    await updateAdminSettings(patch);
    return NextResponse.json({
      ok: true,
      username: patch.username || admin.username,
    });
  }

  if (action === "platform-options") {
    const parsed = platformOptionsSchema.safeParse(body.platformOptions);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid platform options" }, { status: 400 });
    }
    await updateAdminSettings({ platformOptions: parsed.data });
    return NextResponse.json({ ok: true, platformOptions: parsed.data });
  }

  if (action === "notifications") {
    const parsed = notificationSettingsSchema.safeParse(body.notificationSettings);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid notification settings" }, { status: 400 });
    }
    const notificationSettings = normalizeNotificationSettings(parsed.data);
    await updateAdminSettings({ notificationSettings });
    return NextResponse.json({ ok: true, notificationSettings });
  }

  if (action === "notification-broadcast") {
    const parsed = notificationBroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid announcement" }, { status: 400 });
    }
    const admin = await getAdminSettings();
    const settings = normalizeNotificationSettings(admin.notificationSettings);
    if (!settings.systemAnnouncements.enabled) {
      return NextResponse.json(
        { error: "System announcements are disabled" },
        { status: 400 },
      );
    }
    const sent = await broadcastSystemAnnouncement(parsed.data);
    return NextResponse.json({ ok: true, sent });
  }

  if (action === "banners") {
    const banners = Array.isArray(body.banners) ? body.banners : [];
    const cleaned = banners
      .map((b: Partial<OrgBanner>) =>
        normalizeBanner({
          ...b,
          id: String(b.id || randomUUID()),
          title: String(b.title || "").trim(),
          imageUrl: String(b.imageUrl || "").trim(),
          linkUrl: String(b.linkUrl || "").trim(),
          enabled: Boolean(b.enabled),
        }),
      )
      .filter(Boolean) as OrgBanner[];
    const limited = cleaned.slice(0, 20);
    const patch: { banners: OrgBanner[]; bannerSlideIntervalSec?: number } = {
      banners: limited,
    };
    if (body.bannerSlideIntervalSec !== undefined) {
      patch.bannerSlideIntervalSec = normalizeBannerSlideIntervalSec(
        body.bannerSlideIntervalSec,
      );
    }
    await updateAdminSettings(patch);
    const admin = await getAdminSettings();
    return NextResponse.json({
      ok: true,
      banners: limited,
      bannerSlideIntervalSec: normalizeBannerSlideIntervalSec(admin.bannerSlideIntervalSec),
    });
  }

  if (action === "banner-slide-interval") {
    const sec = normalizeBannerSlideIntervalSec(body.bannerSlideIntervalSec);
    await updateAdminSettings({ bannerSlideIntervalSec: sec });
    return NextResponse.json({ ok: true, bannerSlideIntervalSec: sec });
  }

  if (action === "site-appearance") {
    const appearance = normalizeSiteAppearance(body.siteAppearance);
    await updateAdminSettings({ siteAppearance: appearance });
    return NextResponse.json({ ok: true, siteAppearance: appearance });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
