import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  getCurrentCustomer,
  loginCustomer,
  registerCustomer,
  sanitizeCustomer,
} from "@/lib/fashion/customer-auth";
import { issueOtp, verifyOtp } from "@/lib/fashion/otp";
import {
  findCustomerByEmail,
  updateCustomerPassword,
} from "@/lib/fashion/store";
import { fashionDataDir } from "@/lib/fashion/paths";
import { deliverEmailOtp } from "@/lib/otp-delivery";

type PendingReg = {
  name: string;
  email: string;
  phone: string;
  password: string;
  channel: "email";
  expiresAt: number;
};

function pendingPath(): string {
  return path.join(/* turbopackIgnore: true */ fashionDataDir(), "fashion-pending-reg.json");
}

async function readPending(): Promise<Record<string, PendingReg>> {
  try {
    return JSON.parse(await readFile(pendingPath(), "utf8")) as Record<string, PendingReg>;
  } catch {
    return {};
  }
}

async function writePending(data: Record<string, PendingReg>) {
  await mkdir(fashionDataDir(), { recursive: true });
  await writeFile(pendingPath(), JSON.stringify(data, null, 2), "utf8");
}

function maskEmail(email: string) {
  return email.replace(/(.{2}).+(@.+)/, "$1***$2");
}

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: sanitizeCustomer(customer) });
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    if (body.action === "register-send-otp") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const phone = String(body.phone ?? "").trim();
      if (!body.name || !email || !phone || !body.password) {
        return NextResponse.json({ error: "সব ঘর পূরণ করুন" }, { status: 400 });
      }
      if (!email.includes("@")) {
        return NextResponse.json({ error: "সঠিক Gmail / ইমেইল দিন" }, { status: 400 });
      }
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }, { status: 400 });
      }
      const existing = await findCustomerByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: "এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে" },
          { status: 400 },
        );
      }
      const { code } = await issueOtp({
        purpose: "register",
        channel: "email",
        target: email,
      });
      const delivery = await deliverEmailOtp(email, code, {
        allowInline: false,
        productName: "Noorzaa",
      });
      if (!delivery.delivered || delivery.mode === "inline") {
        return NextResponse.json(
          {
            error:
              delivery.detail ||
              "Gmail OTP পাঠানো যায়নি। RESEND_API_KEY / OTP_FROM_EMAIL চেক করুন।",
          },
          { status: 503 },
        );
      }
      const pending = await readPending();
      pending[email] = {
        name: body.name,
        email,
        phone,
        password: body.password,
        channel: "email",
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      await writePending(pending);
      return NextResponse.json({
        ok: true,
        channel: "email",
        targetHint: maskEmail(email),
      });
    }

    if (body.action === "register-verify") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const pendingAll = await readPending();
      const pending = pendingAll[email];
      if (!pending || pending.expiresAt < Date.now()) {
        delete pendingAll[email];
        await writePending(pendingAll);
        return NextResponse.json(
          { error: "রেজিস্ট্রেশন সেশন শেষ — আবার চেষ্টা করুন" },
          { status: 400 },
        );
      }
      const ok = await verifyOtp({
        purpose: "register",
        target: pending.email,
        code: body.code ?? "",
      });
      if (!ok) {
        return NextResponse.json({ error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 400 });
      }
      const customer = await registerCustomer({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        password: pending.password,
        verified: true,
        verifiedChannel: "email",
      });
      delete pendingAll[email];
      await writePending(pendingAll);
      return NextResponse.json({ customer: sanitizeCustomer(customer) });
    }

    if (body.action === "register") {
      return NextResponse.json(
        { error: "OTP ছাড়া রেজিস্ট্রেশন বন্ধ — Gmail OTP ব্যবহার করুন" },
        { status: 400 },
      );
    }

    if (body.action === "login") {
      const customer = await loginCustomer(body.email, body.password);
      return NextResponse.json({ customer: sanitizeCustomer(customer) });
    }

    if (body.action === "forgot-send-otp") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "সঠিক Gmail / ইমেইল দিন" }, { status: 400 });
      }
      const customer = await findCustomerByEmail(email);
      if (!customer) {
        return NextResponse.json(
          { error: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নেই" },
          { status: 404 },
        );
      }
      const { code } = await issueOtp({
        purpose: "customer-reset",
        channel: "email",
        target: customer.email,
      });
      const delivery = await deliverEmailOtp(customer.email, code, {
        allowInline: false,
        productName: "Noorzaa",
      });
      if (!delivery.delivered || delivery.mode === "inline") {
        return NextResponse.json(
          {
            error:
              delivery.detail ||
              "Gmail OTP পাঠানো যায়নি। RESEND_API_KEY / OTP_FROM_EMAIL চেক করুন।",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({
        ok: true,
        channel: "email",
        email: customer.email,
        targetHint: maskEmail(customer.email),
      });
    }

    if (body.action === "forgot-reset") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const customer = await findCustomerByEmail(email);
      if (!customer) {
        return NextResponse.json({ error: "অ্যাকাউন্ট পাওয়া যায়নি" }, { status: 404 });
      }
      const ok = await verifyOtp({
        purpose: "customer-reset",
        target: customer.email,
        code: body.code ?? "",
      });
      if (!ok) {
        return NextResponse.json({ error: "OTP সঠিক নয় বা মেয়াদ শেষ" }, { status: 400 });
      }
      const newPassword = String(body.newPassword ?? "");
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }, { status: 400 });
      }
      await updateCustomerPassword(customer.id, newPassword);
      const loggedIn = await loginCustomer(customer.email, newPassword);
      return NextResponse.json({ customer: sanitizeCustomer(loggedIn) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth failed" },
      { status: 400 },
    );
  }
}
