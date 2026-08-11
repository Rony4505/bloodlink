"use client";

import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import { buildWhatsAppSupportUrl } from "@/lib/fashion/whatsapp";
import type { FashionOrder, StoreSettings } from "@/lib/fashion/types";

export function OrderInvoiceView({
  order,
  settings,
  id = "order-invoice-print",
}: {
  order: FashionOrder;
  settings?: Pick<StoreSettings, "brandName" | "contactPhone" | "whatsapp"> | null;
  id?: string;
}) {
  const brand = settings?.brandName ?? "Slowgun";
  const invoiceText = [
    `${brand} Invoice`,
    `Order: ${order.id}`,
    `Tracking: ${order.trackingNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}, ${order.district}`,
    ...order.items.map((i) => `- ${i.name} (${i.size}) x${i.quantity} = ${formatBdt(i.price * i.quantity)}`),
    `Subtotal: ${formatBdt(order.subtotal)}`,
    order.discount ? `Discount: -${formatBdt(order.discount)}` : "",
    `Delivery: ${formatBdt(order.shipping)}`,
    `Total: ${formatBdt(order.total)}`,
    `Status: ${copy.orderStatus[order.status]}`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = buildWhatsAppSupportUrl(
    `Assalamu Alaikum,\n\n${brand} Invoice:\n\n${invoiceText}\n\nধন্যবাদ।`,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[linear-gradient(135deg,#e8b896,#f4d4c2)] px-5 py-2.5 text-sm font-semibold text-[#3d2a24] shadow-md"
        >
          {copy.actions.print} / PDF
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-2.5 text-sm font-semibold text-[#128C7E]"
        >
          WhatsApp-এ PDF/Invoice পাঠান
        </a>
      </div>

      <article
        id={id}
        className="rounded-2xl border border-black/8 bg-white p-6 text-[#2b1d19] print:border-none print:shadow-none"
      >
        <div className="flex flex-wrap justify-between gap-4 border-b border-black/8 pb-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-wider">
              {brand}
            </p>
            <p className="text-sm text-[#8b6456]">Invoice / Delivery Note</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Tracking:</strong> {order.trackingNumber}</p>
            <p>{new Date(order.createdAt).toLocaleString("bn-BD")}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold">গ্রাহক</p>
            <p>{order.customerName}</p>
            <p>{order.phone}</p>
            {order.email ? <p>{order.email}</p> : null}
          </div>
          <div>
            <p className="font-semibold">ডেলিভারি ঠিকানা</p>
            <p>{order.address}</p>
            <p>{order.district}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="py-2">পণ্য</th>
              <th className="py-2">সাইজ/রং</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">মূল্য</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-black/5">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.size} / {item.color}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatBdt(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>সাবটোটাল</dt><dd>{formatBdt(order.subtotal)}</dd></div>
          {order.discount > 0 ? (
            <div className="flex justify-between"><dt>ছাড়</dt><dd>-{formatBdt(order.discount)}</dd></div>
          ) : null}
          <div className="flex justify-between"><dt>ডেলিভারি</dt><dd>{formatBdt(order.shipping)}</dd></div>
          <div className="flex justify-between border-t border-black/10 pt-2 text-base font-bold">
            <dt>মোট</dt><dd>{formatBdt(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-[#8b6456]">
          স্ট্যাটাস: {copy.orderStatus[order.status]} · পেমেন্ট: {order.paymentMethod.toUpperCase()}
        </p>
      </article>
    </div>
  );
}
