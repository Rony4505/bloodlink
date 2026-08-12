import { NextResponse } from "next/server";
import {
  clearFashionAdminSession,
  createFashionAdminSession,
  isFashionAdminAuthenticated,
} from "@/lib/fashion/customer-auth";
import { issueOtp, verifyOtp } from "@/lib/fashion/otp";
import {
  getAdminUsername,
  getStoreSettings,
  updateAdminPassword,
  verifyFashionAdminCredentials,
} from "@/lib/fashion/store";

export async function GET() {
  return NextResponse.json({ admin: await isFashionAdminAuthenticated() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action ?? "login";

  if (action === "credentials") {
    const ok = await verifyFashionAdminCredentials(
      body.username ?? "",
      body.password ?? "",
    );
    if (!ok) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "login" || action === "login-direct") {
    const ok = await verifyFashionAdminCredentials(
      body.username ?? "",
      body.password ?? "",
    );
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    await createFashionAdminSession();
    return NextResponse.json({ ok: true });
  }

  if (action === "forgot-send-otp") {
    const settings = await getStoreSettings();
    const channel = body.channel === "phone" ? "phone" : "email";
    const target =
      channel === "phone"
        ? settings.adminPhone || String(body.phone ?? "").trim()
        : settings.adminEmail || String(body.email ?? "").trim().toLowerCase();
    if (!target) {
      return NextResponse.json(
        { error: "Admin email/phone Settings-এ সেট করা নেই" },
        { status: 400 },
      );
    }
    const { code } = await issueOtp({
      purpose: "admin-reset",
      channel,
      target,
    });
    return NextResponse.json({
      ok: true,
      channel,
      targetHint:
        channel === "email"
          ? target.replace(/(.{2}).+(@.+)/, "$1***$2")
          : `***${target.slice(-4)}`,
      debugOtp: code,
    });
  }

  if (action === "forgot-reset-password") {
    const settings = await getStoreSettings();
    const channel = body.channel === "phone" ? "phone" : "email";
    const target =
      channel === "phone"
        ? settings.adminPhone || String(body.phone ?? "").trim()
        : settings.adminEmail || String(body.email ?? "").trim().toLowerCase();
    const okOtp = await verifyOtp({
      purpose: "admin-reset",
      target,
      code: body.code ?? "",
    });
    if (!okOtp) {
      return NextResponse.json({ error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 401 });
    }
    const newPassword = String(body.newPassword ?? "");
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }, { status: 400 });
    }
    await updateAdminPassword(newPassword);
    return NextResponse.json({ ok: true });
  }

  if (action === "forgot-recover-username") {
    const settings = await getStoreSettings();
    const channel = body.channel === "phone" ? "phone" : "email";
    const target =
      channel === "phone"
        ? settings.adminPhone || String(body.phone ?? "").trim()
        : settings.adminEmail || String(body.email ?? "").trim().toLowerCase();
    const okOtp = await verifyOtp({
      purpose: "admin-reset",
      target,
      code: body.code ?? "",
    });
    if (!okOtp) {
      return NextResponse.json({ error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 401 });
    }
    const username = await getAdminUsername();
    return NextResponse.json({ ok: true, username });
  }

  // Legacy OTP login (kept for backwards compatibility, not used by UI)
  if (action === "send-otp") {
    const ok = await verifyFashionAdminCredentials(
      body.username ?? "",
      body.password ?? "",
    );
    if (!ok) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const settings = await getStoreSettings();
    const channel = body.channel === "phone" ? "phone" : "email";
    const target =
      channel === "phone"
        ? settings.adminPhone || body.phone || ""
        : settings.adminEmail || body.email || "";
    if (!target) {
      return NextResponse.json(
        { error: "Admin email/phone not configured in Settings" },
        { status: 400 },
      );
    }
    const { code } = await issueOtp({
      purpose: "admin-login",
      channel,
      target,
    });
    return NextResponse.json({
      ok: true,
      channel,
      targetHint:
        channel === "email"
          ? target.replace(/(.{2}).+(@.+)/, "$1***$2")
          : `***${target.slice(-4)}`,
      debugOtp: code,
    });
  }

  if (action === "verify-otp") {
    const okCreds = await verifyFashionAdminCredentials(
      body.username ?? "",
      body.password ?? "",
    );
    if (!okCreds) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const settings = await getStoreSettings();
    const channel = body.channel === "phone" ? "phone" : "email";
    const target =
      channel === "phone"
        ? settings.adminPhone || body.phone || ""
        : settings.adminEmail || body.email || "";
    const okOtp = await verifyOtp({
      purpose: "admin-login",
      target,
      code: body.code ?? "",
    });
    if (!okOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }
    await createFashionAdminSession();
    return NextResponse.json({ ok: true });
  }

  const ok = await verifyFashionAdminCredentials(
    body.username || "founder",
    body.password ?? "",
  );
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createFashionAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearFashionAdminSession();
  return NextResponse.json({ ok: true });
}
