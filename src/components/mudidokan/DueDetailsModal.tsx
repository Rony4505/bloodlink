"use client";

import { useState } from "react";
import { formatDate, formatTaka, formatTime, lineTotal } from "@/lib/mudidokan/format";
import { formatWeightDisplay } from "@/lib/mudidokan/units";
import { isWeightUnit } from "@/lib/mudidokan/units";
import type { Sale } from "@/lib/mudidokan/types";

type Props = {
  sale: Sale;
  onCollect: (amount: number, note?: string) => void;
  onClose: () => void;
};

export function DueDetailsModal({ sale, onCollect, onClose }: Props) {
  const [amount, setAmount] = useState(String(sale.due));
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-red-700">বাকি বিবরণ</h3>
            <p className="text-sm text-slate-500">
              #{sale.invoiceNo} · {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {sale.customerName && (
          <p className="mb-2 text-sm">
            <span className="text-slate-500">গ্রাহক:</span> {sale.customerName}
            {sale.customerPhone ? ` (${sale.customerPhone})` : ""}
          </p>
        )}

        <ul className="mb-4 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
          {sale.items.map((line) => (
            <li key={line.lineId} className="flex justify-between">
              <span>
                {line.name}
                {line.weight != null && isWeightUnit(line.unit)
                  ? ` (${formatWeightDisplay(line.weight, line.unit)})`
                  : ` ×${line.qty}`}
              </span>
              <span>{formatTaka(lineTotal(line))}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-100 p-2">
            <p className="text-xs text-slate-500">মোট</p>
            <p className="font-bold">{formatTaka(sale.total)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2">
            <p className="text-xs text-emerald-700">জমা</p>
            <p className="font-bold text-emerald-800">{formatTaka(sale.paid)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-2">
            <p className="text-xs text-red-600">বাকি</p>
            <p className="font-bold text-red-700">{formatTaka(sale.due)}</p>
          </div>
        </div>

        {sale.collections.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold">আগের সংগ্রহ</p>
            <ul className="space-y-1 text-sm">
              {sale.collections.map((c) => (
                <li key={c.id} className="flex justify-between rounded-lg bg-emerald-50 px-2 py-1">
                  <span>{formatTime(c.createdAt)}</span>
                  <span className="font-medium text-emerald-800">{formatTaka(c.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sale.due > 0 && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="font-semibold text-emerald-800">বাকি সংগ্রহ</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="টাকার পরিমাণ"
              className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="নোট (ঐচ্ছিক)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => onCollect(Number(amount) || 0, note)}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
            >
              সংগ্রহ করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
