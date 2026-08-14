"use client";

import {
  formatDate,
  formatTaka,
  formatTime,
  lineTotal,
} from "@/lib/mudidokan/format";
import { formatWeightDisplay, isWeightUnit } from "@/lib/mudidokan/units";
import type { Sale } from "@/lib/mudidokan/types";

type Props = {
  sale: Sale;
  shopName: string;
};

export function ReceiptContent({ sale, shopName }: Props) {
  return (
    <div className="text-sm">
      <h2 className="text-center text-lg font-bold">{shopName}</h2>
      <p className="text-center text-xs text-slate-500">
        ইনভয়েস #{sale.invoiceNo} · {formatDate(sale.createdAt)} · {formatTime(sale.createdAt)}
      </p>
      {sale.customerName && (
        <p className="mt-1 text-center text-xs">গ্রাহক: {sale.customerName}</p>
      )}
      <hr className="my-3 border-dashed border-slate-300" />
      <ul className="space-y-2">
        {sale.items.map((line) => (
          <li key={line.lineId} className="flex justify-between gap-2">
            <span className="min-w-0 flex-1">
              {line.name}
              {line.weight != null && isWeightUnit(line.unit)
                ? ` (${formatWeightDisplay(line.weight, line.unit)})`
                : ` × ${line.qty}`}
            </span>
            <span className="font-medium">{formatTaka(lineTotal(line))}</span>
          </li>
        ))}
      </ul>
      <hr className="my-3 border-dashed border-slate-300" />
      <div className="space-y-1">
        <div className="flex justify-between text-base font-bold">
          <span>মোট</span>
          <span>{formatTaka(sale.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>পেয়েছি</span>
          <span>{formatTaka(sale.paid)}</span>
        </div>
        {sale.change > 0 && (
          <div className="flex justify-between text-sm">
            <span>ফেরত</span>
            <span>{formatTaka(sale.change)}</span>
          </div>
        )}
        {sale.due > 0 && (
          <div className="flex justify-between font-semibold text-red-600">
            <span>বাকি</span>
            <span>{formatTaka(sale.due)}</span>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">ধন্যবাদ!</p>
    </div>
  );
}
