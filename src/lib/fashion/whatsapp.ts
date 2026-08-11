import type { CheckoutForm, FashionOrder, FashionOrderItem } from "./types";
import { formatBdt } from "./format";

const WHATSAPP_NUMBER = process.env.FASHION_WHATSAPP || "8801700000000";

export function getWhatsAppNumber(): string {
  return WHATSAPP_NUMBER.replace(/\D/g, "");
}

export function buildWhatsAppOrderMessage(order: {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  paymentMethod: CheckoutForm["paymentMethod"];
  items: FashionOrderItem[];
  total: number;
  note?: string;
}): string {
  const paymentLabel =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : order.paymentMethod === "bkash"
        ? "bKash"
        : "Nagad";

  const lines = [
    "Assalamu Alaikum, Slowgun থেকে নতুন অর্ডার:",
    "",
    `Order ID: ${order.id}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.district}`,
    `Payment: ${paymentLabel}`,
    "",
    "Items:",
    ...order.items.map(
      (item) =>
        `- ${item.name} (${item.size}, ${item.color}) x${item.quantity} = ${formatBdt(item.price * item.quantity)}`,
    ),
    "",
    `Total: ${formatBdt(order.total)}`,
  ];

  if (order.note) {
    lines.push("", `Note: ${order.note}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(order: FashionOrder): string {
  const text = encodeURIComponent(buildWhatsAppOrderMessage(order));
  return `https://wa.me/${getWhatsAppNumber()}?text=${text}`;
}

export function buildWhatsAppSupportUrl(message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${getWhatsAppNumber()}?text=${text}`;
}
