/**
 * OTP delivery for donor registration.
 * Prefer sms.bd (Alpha):
 * - SMS_NET_BD_API_KEY (from sms.bd panel → API)
 * - optional SMS_NET_BD_SENDER_ID (masking only; leave empty for non-masking)
 *
 * Fallback webhook:
 * - SMS_WEBHOOK_URL (POST JSON { to, message })
 *
 * Registration must never return OTP codes in API responses.
 */

export type OtpDeliveryResult = {
  delivered: boolean;
  mode: "email" | "sms" | "inline";
  detail?: string;
};

export type OtpDeliveryOptions = {
  /** When false, never fall back to inline codes (registration). Default true for other flows. */
  allowInline?: boolean;
};

function allowInlineOtp(): boolean {
  const flag = (process.env.ALLOW_INLINE_OTP || "").trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return true;
}

/** sms.bd accepts 01X… or 8801X… — normalize to 8801XXXXXXXXX. */
function toSmsBdNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) return digits.slice(0, 13);
  if (digits.startsWith("0") && digits.length === 11) return `88${digits}`;
  if (digits.length === 10 && digits.startsWith("1")) return `880${digits}`;
  return digits;
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

/** Direct sms.bd / Alpha Net gateway (https://api.sms.net.bd/sendsms). */
async function sendViaSmsBd(to: string, message: string): Promise<OtpDeliveryResult | null> {
  const apiKey = process.env.SMS_NET_BD_API_KEY?.trim();
  if (!apiKey) return null;

  const payload: Record<string, string> = {
    api_key: apiKey,
    msg: message,
    to: toSmsBdNumber(to),
  };
  const senderId = process.env.SMS_NET_BD_SENDER_ID?.trim();
  if (senderId) payload.sender_id = senderId;

  try {
    const res = await fetch("https://api.sms.net.bd/sendsms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let data: { error?: number | string; msg?: string } = {};
    try {
      data = JSON.parse(raw) as { error?: number | string; msg?: string };
    } catch {
      // non-JSON body
    }
    const errCode = Number(data.error);
    if (res.ok && errCode === 0) {
      return { delivered: true, mode: "sms" };
    }
    return {
      delivered: false,
      mode: "sms",
      detail: data.msg || `sms.bd error ${data.error ?? res.status}`,
    };
  } catch {
    return {
      delivered: false,
      mode: "sms",
      detail: "sms.bd request failed",
    };
  }
}

export async function deliverEmailOtp(
  to: string,
  code: string,
  options?: OtpDeliveryOptions,
): Promise<OtpDeliveryResult> {
  const subject = "BloodLink BD verification code";
  const text = `Your BloodLink BD verification code is ${code}. It expires in 15 minutes. Do not share this code.`;
  if (await sendViaResend(to, subject, text)) {
    return { delivered: true, mode: "email" };
  }
  if (await sendViaSmtp(to, subject, text)) {
    return { delivered: true, mode: "email" };
  }
  const canInline = options?.allowInline !== false && allowInlineOtp();
  if (canInline) {
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
  options?: OtpDeliveryOptions,
): Promise<OtpDeliveryResult> {
  const message = `BloodLink BD code: ${code}. Valid 15 minutes. Do not share.`;

  const smsBd = await sendViaSmsBd(to, message);
  if (smsBd) return smsBd;

  const webhook = process.env.SMS_WEBHOOK_URL?.trim();
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
        }),
      });
      if (res.ok) return { delivered: true, mode: "sms" };
      return {
        delivered: false,
        mode: "sms",
        detail: `SMS webhook returned ${res.status}`,
      };
    } catch {
      return {
        delivered: false,
        mode: "sms",
        detail: "SMS webhook request failed",
      };
    }
  }

  const canInline = options?.allowInline !== false && allowInlineOtp();
  if (canInline) {
    return {
      delivered: true,
      mode: "inline",
      detail: "SMS provider not configured; code returned for verification.",
    };
  }
  return {
    delivered: false,
    mode: "sms",
    detail: "SMS_NET_BD_API_KEY (or SMS_WEBHOOK_URL) is not configured",
  };
}
