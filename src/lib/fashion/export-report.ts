import type { FashionOrder } from "./types";
import type { ReportType } from "@/components/fashion/admin/ReportContent";

function escapeCsv(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const bom = "\uFEFF";
  const body = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportReportCsv(type: ReportType, orders: FashionOrder[]) {
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "sell") {
    const active = orders.filter((o) => o.status !== "cancelled");
    downloadCsv(`noorzaa-sales-${stamp}.csv`, [
      ["Order ID", "Tracking", "Customer", "Phone", "Status", "Total", "Date"],
      ...active.map((o) => [
        o.id,
        o.trackingNumber,
        o.customerName,
        o.phone,
        o.status,
        o.total,
        o.createdAt,
      ]),
    ]);
    return;
  }

  if (type === "delivery") {
    const byDistrict = orders.reduce<
      Record<string, { count: number; fees: number; total: number }>
    >((acc, o) => {
      if (o.status === "cancelled") return acc;
      if (!acc[o.district]) acc[o.district] = { count: 0, fees: 0, total: 0 };
      acc[o.district].count += 1;
      acc[o.district].fees += o.shipping;
      acc[o.district].total += o.total;
      return acc;
    }, {});

    downloadCsv(`noorzaa-delivery-${stamp}.csv`, [
      ["District", "Orders", "Delivery Fees", "Total Sales"],
      ...Object.entries(byDistrict).map(([district, data]) => [
        district,
        data.count,
        data.fees,
        data.total,
      ]),
    ]);
    return;
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

  downloadCsv(`noorzaa-customers-${stamp}.csv`, [
    ["Name", "Phone", "Orders", "Total Spent"],
    ...Object.values(customers).map((c) => [c.name, c.phone, c.orders, c.spent]),
  ]);
}
