"use client";

import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder } from "@/lib/fashion/types";

export type ReportType = "sell" | "delivery" | "customer";

export function ReportContent({
  type,
  orders,
  id = "admin-report-print",
}: {
  type: ReportType;
  orders: FashionOrder[];
  id?: string;
}) {
  const title =
    type === "sell"
      ? "বিক্রয় রিপোর্ট"
      : type === "delivery"
        ? "ডেলিভারি রিপোর্ট"
        : "গ্রাহক রিপোর্ট";

  if (type === "sell") {
    const active = orders.filter((o) => o.status !== "cancelled");
    const revenue = active.reduce((s, o) => s + o.total, 0);
    return (
      <article id={id} className="rounded-2xl bg-white p-4 print:p-0">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h3>
        <p className="text-sm text-[#8b6456]">{new Date().toLocaleString("bn-BD")}</p>
        <p className="mt-2 font-semibold">মোট বিক্রয়: {formatBdt(revenue)} · {active.length} অর্ডার</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">ID</th>
              <th className="py-2 text-left">Tracking</th>
              <th className="py-2 text-left">Customer</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {active.map((o) => (
              <tr key={o.id} className="border-b border-black/5">
                <td className="py-2">{o.id}</td>
                <td className="py-2">{o.trackingNumber}</td>
                <td className="py-2">{o.customerName}</td>
                <td className="py-2">{copy.orderStatus[o.status]}</td>
                <td className="py-2 text-right">{formatBdt(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    );
  }

  if (type === "delivery") {
    const byDistrict = orders.reduce<Record<string, { count: number; fees: number; total: number }>>(
      (acc, o) => {
        if (o.status === "cancelled") return acc;
        if (!acc[o.district]) acc[o.district] = { count: 0, fees: 0, total: 0 };
        acc[o.district].count += 1;
        acc[o.district].fees += o.shipping;
        acc[o.district].total += o.total;
        return acc;
      },
      {},
    );
    return (
      <article id={id} className="rounded-2xl bg-white p-4 print:p-0">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h3>
        <p className="text-sm text-[#8b6456]">{new Date().toLocaleString("bn-BD")}</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">জেলা</th>
              <th className="py-2 text-center">অর্ডার</th>
              <th className="py-2 text-right">ডেলিভারি ফি</th>
              <th className="py-2 text-right">মোট বিক্রয়</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byDistrict).map(([district, data]) => (
              <tr key={district} className="border-b border-black/5">
                <td className="py-2">{district}</td>
                <td className="py-2 text-center">{data.count}</td>
                <td className="py-2 text-right">{formatBdt(data.fees)}</td>
                <td className="py-2 text-right">{formatBdt(data.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    );
  }

  const customers = orders.reduce<
    Record<string, { name: string; phone: string; orders: number; spent: number }>
  >((acc, o) => {
    const key = o.phone;
    if (!acc[key]) acc[key] = { name: o.customerName, phone: o.phone, orders: 0, spent: 0 };
    acc[key].orders += 1;
    if (o.status !== "cancelled") acc[key].spent += o.total;
    return acc;
  }, {});

  return (
    <article id={id} className="rounded-2xl bg-white p-4 print:p-0">
      <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h3>
      <p className="text-sm text-[#8b6456]">{new Date().toLocaleString("bn-BD")}</p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">নাম</th>
            <th className="py-2 text-left">ফোন</th>
            <th className="py-2 text-center">অর্ডার</th>
            <th className="py-2 text-right">মোট খরচ</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(customers).map((c) => (
            <tr key={c.phone} className="border-b border-black/5">
              <td className="py-2">{c.name}</td>
              <td className="py-2">{c.phone}</td>
              <td className="py-2 text-center">{c.orders}</td>
              <td className="py-2 text-right">{formatBdt(c.spent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
