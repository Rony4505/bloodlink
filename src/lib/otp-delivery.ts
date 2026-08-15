/**
 * OTP delivery for donor registration.
 * Configure one of:
 * - RESEND_API_KEY (+ OTP_FROM_EMAIL)
 * - SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM
 * - SMS_WEBHOOK_URL (POST JSON { to, message })
 *
 * When no provider is set, codes are returned inline so registration still works
 * (same pattern as admin verify). Set ALLOW_INLINE_OTP=false to require real delivery.
 */

export type OtpDeliveryResult = {
  delivered: boolean;
  mode: "email" | "sms" | "inline";
  detail?: string;
};

function allowInlineOtp(): boolean {
  const flag = (process.env.ALLOW_INLINE_OTP || "").trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  // Default: allow inline when no provider configured (dev / early production).
  return true;
}

async function sendViaResend(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const from = process.env.OTP_FROM_EMAIL?.trim() || "BloodLink BD <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendViaSmtp(to: string, subject: string, text: string): Promise<boolean> {
  // Optional SMTP via raw fetch to a relay webhook (avoids nodemailer dependency).
  const relay = process.env.SMTP_WEBHOOK_URL?.trim();
  if (!relay) return false;
  try {
    const res = await fetch(relay, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text, from: process.env.SMTP_FROM || "" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deliverEmailOtp(
  to: string,
  code: string,
): Promise<OtpDeliveryResult> {
  const subject = "BloodLink BD verification code";
  const text = `Your BloodLink BD verification code is ${code}. It expires in 15 minutes. Do not share this code.`;
  if (await sendViaResend(to, subject, text)) {
    return { delivered: true, mode: "email" };
  }
  if (await sendViaSmtp(to, subject, text)) {
    return { delivered: true, mode: "email" };
  }
  if (allowInlineOtp()) {
    return {
      delivered: true,
      mode: "inline",
      detail: "Email provider not configured; code returned for verification.",
    };
  }
  return { delivered: false, mode: "email", detail: "Email OTP delivery failed" };
}

export async function deliverSmsOtp(
  to: string,
  code: string,
): Promise<OtpDeliveryResult> {
  const webhook = process.env.SMS_WEBHOOK_URL?.trim();
  const message = `BloodLink BD code: ${code}. Valid 15 minutes. Do not share.`;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          message,
          text: message,
          phone: to,
          code,
        }),
      });
      if (res.ok) return { delivered: true, mode: "sms" };
    } catch {
      // fall through
    }
  }
  if (allowInlineOtp()) {
    return {
      delivered: true,
      mode: "inline",
      detail: "SMS provider not configured; code returned for verification.",
    };
  }
  return { delivered: false, mode: "sms", detail: "SMS OTP delivery failed" };
}
