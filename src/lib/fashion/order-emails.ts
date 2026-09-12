import { copy as fashionCopy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder, OrderStatus } from "@/lib/fashion/types";
import { getSiteUrl } from "@/lib/site";
import { sendTransactionalEmail } from "@/lib/otp-delivery";

const BRAND = "Noorzaa";

function paymentLabel(method: FashionOrder["paymentMethod"]): string {
  if (method === "bkash") return fashionCopy.form.bkash;
  if (method === "nagad") return fashionCopy.form.nagad;
  return fashionCopy.form.cod;
}

function statusLabel(status: OrderStatus): string {
  return fashionCopy.orderStatus[status] || status;
}

function formatItemLines(order: FashionOrder): string[] {
  return order.items.map((item) => {
    const variant = [item.size, item.color].filter(Boolean).join(", ");
    const name = variant ? `${item.name} (${variant})` : item.name;
    return `• ${name} × ${item.quantity} = ${formatBdt(item.price * item.quantity)}`;
  });
}

function trackUrl(trackingNumber: string): string {
  const base = getSiteUrl("fashion").replace(/\/$/, "");
  return `${base}/track?tracking=${encodeURIComponent(trackingNumber)}`;
}

function buildConfirmationText(order: FashionOrder): string {
  const lines = [
    `Assalamu Alaikum ${order.customerName},`,
    "",
    `আপনার ${BRAND} অর্ডার সফলভাবে গ্রহণ করা হয়েছে।`,
    "",
    `অর্ডার ID: ${order.id}`,
    `ট্র্যাকিং নম্বর: ${order.trackingNumber}`,
    `স্ট্যাটাস: ${statusLabel(order.status)}`,
    "",
    "পণ্যের বিবরণ:",
    ...formatItemLines(order),
    "",
    `সাবটোটাল: ${formatBdt(order.subtotal)}`,
  ];

  if (order.discount > 0) {
    lines.push(`ডিসকাউন্ট: −${formatBdt(order.discount)}`);
  }
  lines.push(
    `ডেলিভারি চার্জ: ${formatBdt(order.shipping)}`,
    `মোট: ${formatBdt(order.total)}`,
    `পেমেন্ট: ${paymentLabel(order.paymentMethod)}`,
    "",
    "ডেলিভারি ঠিকানা:",
    `${order.address}`,
    `${order.district}`,
    `ফোন: ${order.phone}`,
    "",
    `ট্র্যাক করুন: ${trackUrl(order.trackingNumber)}`,
    "",
    "অর্ডার স্ট্যাটাস আপডেট হলে আমরা ইমেইলে জানাব।",
    "",
    `ধন্যবাদ,`,
    BRAND,
  );

  return lines.join("\n");
}

function buildStatusUpdateText(
  order: FashionOrder,
  status: OrderStatus,
  message: string,
): string {
  const lines = [
    `Assalamu Alaikum ${order.customerName},`,
    "",
    `আপনার ${BRAND} অর্ডারের ট্র্যাকিং আপডেট হয়েছে।`,
    "",
    `অর্ডার ID: ${order.id}`,
    `ট্র্যাকিং নম্বর: ${order.trackingNumber}`,
    `নতুন স্ট্যাটাস: ${statusLabel(status)}`,
    `বিস্তারিত: ${message}`,
    "",
    "পণ্য:",
    ...formatItemLines(order),
    "",
    `মোট: ${formatBdt(order.total)}`,
    "",
    `ট্র্যাক করুন: ${trackUrl(order.trackingNumber)}`,
    "",
    `ধন্যবাদ,`,
    BRAND,
  ];
  return lines.join("\n");
}

export async function sendOrderConfirmationEmail(
  order: FashionOrder,
): Promise<{ ok: boolean; detail?: string }> {
  const to = order.email?.trim();
  if (!to) return { ok: false, detail: "Order has no email" };

  return sendTransactionalEmail({
    to,
    subject: `${BRAND} · অর্ডার নিশ্চিত · ${order.trackingNumber}`,
    text: buildConfirmationText(order),
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
    productName: BRAND,
  });
}
