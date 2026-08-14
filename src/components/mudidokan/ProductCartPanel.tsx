"use client";

import { formatTaka, lineTotal } from "@/lib/mudidokan/format";
import type { CartLine } from "@/lib/mudidokan/types";
import { isWeightUnit } from "@/lib/mudidokan/units";

type Props = {
  cart: CartLine[];
  total: number;
  onOpenCheckout: () => void;
  onRemoveLine: (lineId: string) => void;
};

function qtyLabel(line: CartLine): string {
  if (line.weight != null && isWeightUnit(line.unit)) {
    if (line.unit === "গ্রাম") return `${Math.round(line.weight)} g`;
    return `${Math.round(line.weight * 1000)} g`;
  }
  return `${line.qty} pcs`;
}

export function ProductCartPanel({ cart, total, onOpenCheckout, onRemoveLine }: Props) {
  return (
    <div className="flex h-[280px] flex-col overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white shadow-md">
      <div className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-3 py-2">
        <p className="text-sm font-bold text-emerald-900">পণ্য সিলেক্ট করুন</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {cart.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">কোনো পণ্য নেই</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white text-slate-500">
              <tr>
                <th className="pb-1 font-semibold">নাম</th>
                <th className="pb-1 font-semibold">দাম</th>
                <th className="pb-1 font-semibold">Wt/Pcs</th>
                <th className="pb-1 text-right font-semibold">মোট</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((line) => (
                <tr
                  key={line.lineId}
                  className="border-b border-slate-50 align-top"
                  onDoubleClick={() => onRemoveLine(line.lineId)}
                >
                  <td className="max-w-[72px] truncate py-1.5 pr-1 font-medium">{line.name}</td>
                  <td className="whitespace-nowrap py-1.5 pr-1">{formatTaka(line.price)}</td>
                  <td className="whitespace-nowrap py-1.5 pr-1">{qtyLabel(line)}</td>
                  <td className="whitespace-nowrap py-1.5 text-right font-bold">
                    {formatTaka(lineTotal(line))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="shrink-0 border-t border-emerald-100 p-2">
        <button
          type="button"
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-3 py-2.5 font-bold text-white disabled:opacity-40"
        >
          <span>Cart</span>
          <span>Total {formatTaka(total)}</span>
        </button>
      </div>
    </div>
  );
}
