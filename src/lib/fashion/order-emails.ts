import { copy as fashionCopy } from "@/lib/fashion/copy";
import { paymentMethodLabel } from "@/lib/fashion/payment";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder, OrderStatus } from "@/lib/fashion/types";
import { getSiteUrl } from "@/lib/site";
import { sendTransactionalEmail } from "@/lib/otp-delivery";

const BRAND = "Noorzaa";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paymentLabel(method: FashionOrder["paymentMethod"]): string {
  return paymentMethodLabel(method, {
    cod: fashionCopy.form.cod,
    bank: fashionCopy.form.bank,
    mobileBanking: fashionCopy.form.mobileBanking,
    bkash: fashionCopy.form.bkash,
    nagad: fashionCopy.form.nagad,
  });
}

function statusLabel(status: OrderStatus): string {
  return fashionCopy.orderStatus[status] || status;
}

function trackUrl(trackingNumber: string): string {
  const base = getSiteUrl("fashion").replace(/\/$/, "");
  return `${base}/track?tracking=${encodeURIComponent(trackingNumber)}`;
}

function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("bn-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Plain-text invoice block (matches admin OrderInvoiceView fields). */
export function buildOrderInvoiceText(order: FashionOrder): string {
  const lines = [
    "========================================",
    `${BRAND} INVOICE / ইনভয়েস`,
    "========================================",
    `Invoice No: ${order.id}`,
    `Tracking: ${order.trackingNumber}`,
    `Date: ${formatOrderDate(order.createdAt)}`,
    `Status: ${statusLabel(order.status)}`,
    `Payment: ${paymentLabel(order.paymentMethod)}`,
    "",
    "Bill To / গ্রাহক:",
    order.customerName,
    `Phone: ${order.phone}`,
    order.email ? `Email: ${order.email}` : "",
    "",
    "Ship To / ডেলিভারি:",
    order.address,
    order.district,
    "",
    "Items / পণ্য:",
    ...order.items.map((item) => {
      const variant = [item.size, item.color].filter(Boolean).join(" / ");
      return `- ${item.name}${variant ? ` (${variant})` : ""} × ${item.quantity} @ ${formatBdt(item.price)} = ${formatBdt(item.price * item.quantity)}`;
    }),
    "",
    `Subtotal: ${formatBdt(order.subtotal)}`,
  ].filter((line) => line !== "");

  if (order.discount > 0) {
    lines.push(`Discount: −${formatBdt(order.discount)}`);
  }
  if (order.couponCode) {
    lines.push(`Coupon: ${order.couponCode}`);
  }
  lines.push(
    `Delivery: ${formatBdt(order.shipping)}`,
    "----------------------------------------",
    `TOTAL: ${formatBdt(order.total)}`,
    "========================================",
  );

  return lines.join("\n");
}

function buildOrderInvoiceHtml(order: FashionOrder): string {
  const itemRows = order.items
    .map((item) => {
      const variant = [item.size, item.color].filter(Boolean).join(" / ");
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(variant || "—")}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(formatBdt(item.price * item.quantity))}</td>
      </tr>`;
    })
    .join("");

  const discountRow =
    order.discount > 0
      ? `<tr><td>ছাড়${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td><td style="text-align:right;">−${escapeHtml(formatBdt(order.discount))}</td></tr>`
      : "";

  return `
  <div style="margin:24px 0;padding:20px;border:1px solid #e5d5c8;border-radius:12px;background:#fffaf7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td>
          <div style="font-size:20px;font-weight:700;color:#2b1d19;">${BRAND}</div>
          <div style="font-size:13px;color:#8b6456;">Invoice / ইনভয়েস</div>
        </td>
        <td style="text-align:right;font-size:13px;color:#2b1d19;">
          <div><strong>Invoice:</strong> ${escapeHtml(order.id)}</div>
          <div><strong>Tracking:</strong> ${escapeHtml(order.trackingNumber)}</div>
          <div>${escapeHtml(formatOrderDate(order.createdAt))}</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:16px;">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:12px;">
          <div style="font-weight:600;margin-bottom:4px;">গ্রাহক</div>
          <div>${escapeHtml(order.customerName)}</div>
          <div>${escapeHtml(order.phone)}</div>
          ${order.email ? `<div>${escapeHtml(order.email)}</div>` : ""}
        </td>
        <td style="vertical-align:top;width:50%;">
          <div style="font-weight:600;margin-bottom:4px;">ডেলিভারি ঠিকানা</div>
          <div>${escapeHtml(order.address)}</div>
          <div>${escapeHtml(order.district)}</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #ddd;text-align:left;">
          <th style="padding:8px 0;">পণ্য</th>
          <th style="padding:8px 0;">সাইজ/রং</th>
          <th style="padding:8px 0;text-align:center;">Qty</th>
          <th style="padding:8px 0;text-align:right;">মূল্য</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-top:12px;max-width:280px;margin-left:auto;">
      <tr><td>সাবটোটাল</td><td style="text-align:right;">${escapeHtml(formatBdt(order.subtotal))}</td></tr>
      ${discountRow}
      <tr><td>ডেলিভারি</td><td style="text-align:right;">${escapeHtml(formatBdt(order.shipping))}</td></tr>
      <tr style="font-size:15px;font-weight:700;">
        <td style="padding-top:8px;border-top:1px solid #ddd;">মোট</td>
        <td style="padding-top:8px;border-top:1px solid #ddd;text-align:right;">${escapeHtml(formatBdt(order.total))}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#8b6456;">
      স্ট্যাটাস: ${escapeHtml(statusLabel(order.status))} · পেমেন্ট: ${escapeHtml(paymentLabel(order.paymentMethod))}
    </p>
  </div>`;
}

function buildConfirmationText(order: FashionOrder): string {
  return [
    `Assalamu Alaikum ${order.customerName},`,
    "",
    `আপনার ${BRAND} অর্ডার সফলভাবে গ্রহণ করা হয়েছে।`,
    "",
    `ট্র্যাকিং নম্বর: ${order.trackingNumber}`,
    `ট্র্যাক করুন: ${trackUrl(order.trackingNumber)}`,
    "",
    buildOrderInvoiceText(order),
    "",
    "অর্ডার স্ট্যাটাস আপডেট হলে আমরা ইমেইলে জানাব।",
    "",
    `ধন্যবাদ,`,
    BRAND,
  ].join("\n");
}

function buildConfirmationHtml(order: FashionOrder): string {
  const track = trackUrl(order.trackingNumber);
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f7f1ec;font-family:Arial,Helvetica,sans-serif;color:#2b1d19;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
    <p style="margin:0 0 12px;font-size:16px;">Assalamu Alaikum ${escapeHtml(order.customerName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
      আপনার <strong>${BRAND}</strong> অর্ডার সফলভাবে গ্রহণ করা হয়েছে। নিচে আপনার <strong>ইনভয়েস</strong> ও ট্র্যাকিং নম্বর দেওয়া হলো।
    </p>
    <p style="margin:0 0 8px;font-size:14px;">
      <strong>ট্র্যাকিং নম্বর:</strong> ${escapeHtml(order.trackingNumber)}
    </p>
    <p style="margin:0 0 8px;">
      <a href="${escapeHtml(track)}" style="display:inline-block;padding:10px 16px;background:#9d6b8a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        অর্ডার ট্র্যাক করুন
      </a>
    </p>
    ${buildOrderInvoiceHtml(order)}
    <p style="margin:8px 0 0;font-size:13px;color:#6f554a;line-height:1.5;">
      অর্ডার স্ট্যাটাস আপডেট হলে আমরা ইমেইলে জানাব।
    </p>
    <p style="margin:20px 0 0;font-size:14px;">ধন্যবাদ,<br/><strong>${BRAND}</strong></p>
  </div>
</body>
</html>`;
}

function buildStatusUpdateText(
  order: FashionOrder,
  status: OrderStatus,
  message: string,
): string {
  return [
    `Assalamu Alaikum ${order.customerName},`,
    "",
    `আপনার ${BRAND} অর্ডারের ট্র্যাকিং আপডেট হয়েছে।`,
    "",
    `অর্ডার ID: ${order.id}`,
    `ট্র্যাকিং নম্বর: ${order.trackingNumber}`,
    `নতুন স্ট্যাটাস: ${statusLabel(status)}`,
    `বিস্তারিত: ${message}`,
    "",
    `ট্র্যাক করুন: ${trackUrl(order.trackingNumber)}`,
    "",
    buildOrderInvoiceText(order),
    "",
    `ধন্যবাদ,`,
    BRAND,
  ].join("\n");
}

function buildStatusUpdateHtml(
  order: FashionOrder,
  status: OrderStatus,
  message: string,
): string {
  const track = trackUrl(order.trackingNumber);
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f7f1ec;font-family:Arial,Helvetica,sans-serif;color:#2b1d19;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
    <p style="margin:0 0 12px;font-size:16px;">Assalamu Alaikum ${escapeHtml(order.customerName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
      আপনার <strong>${BRAND}</strong> অর্ডারের ট্র্যাকিং আপডেট হয়েছে।
    </p>
    <p style="margin:0 0 6px;font-size:14px;"><strong>নতুন স্ট্যাটাস:</strong> ${escapeHtml(statusLabel(status))}</p>
    <p style="margin:0 0 6px;font-size:14px;"><strong>বিস্তারিত:</strong> ${escapeHtml(message)}</p>
    <p style="margin:0 0 6px;font-size:14px;"><strong>ট্র্যাকিং:</strong> ${escapeHtml(order.trackingNumber)}</p>
    <p style="margin:12px 0;">
      <a href="${escapeHtml(track)}" style="display:inline-block;padding:10px 16px;background:#9d6b8a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        অর্ডার ট্র্যাক করুন
      </a>
    </p>
    ${buildOrderInvoiceHtml(order)}
    <p style="margin:20px 0 0;font-size:14px;">ধন্যবাদ,<br/><strong>${BRAND}</strong></p>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(
  order: FashionOrder,
): Promise<{ ok: boolean; detail?: string }> {
  const to = order.email?.trim();
  if (!to) return { ok: false, detail: "Order has no email" };

  return sendTransactionalEmail({
    to,
    subject: `${BRAND} · অর্ডার + ইনভয়েস · ${order.trackingNumber}`,
    text: buildConfirmationText(order),
    html: buildConfirmationHtml(order),
    productName: BRAND,
  });
}

export async function sendOrderStatusEmail(
  order: FashionOrder,
  status: OrderStatus,
  message: string,
): Promise<{ ok: boolean; detail?: string }> {
  const to = order.email?.trim();
  if (!to) return { ok: false, detail: "Order has no email" };

  return sendTransactionalEmail({
    to,
    subject: `${BRAND} · ট্র্যাকিং আপডেট · ${statusLabel(status)} · ${order.trackingNumber}`,
    text: buildStatusUpdateText(order, status, message),
    html: buildStatusUpdateHtml(order, status, message),
    productName: BRAND,
  });
}
