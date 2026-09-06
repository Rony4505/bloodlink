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
  adminCredentialsSchema,
  notificationBroadcastSchema,
  notificationSettingsSchema,
  platformOptionsSchema,
} from "@/lib/validations";
import type { OrgBanner } from "@/lib/types";
import { z } from "zod";

const recoveryCodeSchema = z.object({
  code: z.string().trim().min(4).max(10),
});


export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = await getAdminSettings();
  const pushAllow = await countPushAllowStats();
  return NextResponse.json({
    username: admin.username,
    verifyEmail: admin.verifyEmail || getAdminRecoveryEmail(),
    recoveryEmail: getAdminRecoveryEmail(),
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

  if (action === "verify-recovery-send") {
    const email = getAdminRecoveryEmail();
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
      verifyEmail: email,
      emailVerified: false,
      pendingEmailCodeHash: hashCode(code),
      pendingPhoneCodeHash: null,
      phoneVerified: false,
      verifyPhone: "",
    });
    return NextResponse.json({
      ok: true,
      emailMasked: maskEmail(email),
      expiresInMinutes: 15,
    });
  }

  if (action === "verify-recovery-confirm") {
    const parsed = recoveryCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
    const admin = await getAdminSettings();
    if (!admin.pendingEmailCodeHash) {
      return NextResponse.json(
        { error: "No pending Gmail verification. Send OTP first." },
        { status: 410 },
      );
    }
    if (hashCode(parsed.data.code) !== admin.pendingEmailCodeHash) {
      return NextResponse.json(
        { error: "Incorrect verification code." },
        { status: 400 },
      );
    }
    const email = getAdminRecoveryEmail();
    await updateAdminSettings({
      verifyEmail: email,
      emailVerified: true,
      pendingEmailCodeHash: null,
      pendingPhoneCodeHash: null,
      phoneVerified: false,
      verifyPhone: "",
    });
    return NextResponse.json({
      ok: true,
      emailVerified: true,
      verifyEmail: email,
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
