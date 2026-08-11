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
import { findCustomerByEmail } from "@/lib/fashion/store";

type PendingReg = {
  name: string;
  email: string;
  phone: string;
  password: string;
  channel: "email" | "phone";
  expiresAt: number;
};

const dataDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const pendingPath = path.join(/* turbopackIgnore: true */ dataDir, "fashion-pending-reg.json");

async function readPending(): Promise<Record<string, PendingReg>> {
  try {
    return JSON.parse(await readFile(pendingPath, "utf8")) as Record<string, PendingReg>;
  } catch {
    return {};
  }
}

async function writePending(data: Record<string, PendingReg>) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(pendingPath, JSON.stringify(data, null, 2), "utf8");
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
      const channel = body.channel === "phone" ? "phone" : "email";
      if (!body.name || !email || !phone || !body.password) {
        return NextResponse.json({ error: "সব ঘর পূরণ করুন" }, { status: 400 });
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
      const target = channel === "phone" ? phone : email;
      const { code } = await issueOtp({
        purpose: "register",
        channel,
        target,
      });
      const pending = await readPending();
      pending[email] = {
        name: body.name,
        email,
        phone,
        password: body.password,
        channel,
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      await writePending(pending);
      return NextResponse.json({
        ok: true,
        channel,
        targetHint:
          channel === "email"
            ? email.replace(/(.{2}).+(@.+)/, "$1***$2")
            : `***${phone.slice(-4)}`,
        debugOtp: code,
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
      const target = pending.channel === "phone" ? pending.phone : pending.email;
      const ok = await verifyOtp({
        purpose: "register",
        target,
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
        verifiedChannel: pending.channel,
      });
      delete pendingAll[email];
      await writePending(pendingAll);
      return NextResponse.json({ customer: sanitizeCustomer(customer) });
    }

    if (body.action === "register") {
      const customer = await registerCustomer({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
      });
      return NextResponse.json({ customer: sanitizeCustomer(customer) });
    }

    if (body.action === "login") {
      const customer = await loginCustomer(body.email, body.password);
      return NextResponse.json({ customer: sanitizeCustomer(customer) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth failed" },
      { status: 400 },
    );
  }
}
