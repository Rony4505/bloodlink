"use client";

import { useState } from "react";
import { formatDate, formatTaka, formatTime } from "@/lib/mudidokan/format";
import type { Sale } from "@/lib/mudidokan/types";
import { ReceiptContent } from "./ReceiptContent";

type Props = {
  sale: Sale;
  shopName: string;
  onClose: () => void;
  onPrint?: () => void;
  onCollect?: (amount: number, note?: string) => void;
};

export function InvoiceDetailsModal({
  sale,
  shopName,
  onClose,
  onPrint,
  onCollect,
}: Props) {
  const [amount, setAmount] = useState(String(sale.due));
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-emerald-900">ইনভয়েস #{sale.invoiceNo}</h3>
            <p className="text-sm text-slate-500">
              {formatDate(sale.createdAt)} · {formatTime(sale.createdAt)}
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

        <ReceiptContent sale={sale} shopName={shopName} />

        {sale.collections.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">বাকি সংগ্রহের তালিকা</p>
            <ul className="space-y-1 text-sm">
              {sale.collections.map((c) => (
                <li key={c.id} className="flex justify-between rounded-lg bg-emerald-50 px-2 py-1">
                  <span>
                    {formatDate(c.createdAt)} {formatTime(c.createdAt)}
                  </span>
                  <span className="font-medium text-emerald-800">{formatTaka(c.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sale.due > 0 && onCollect && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <p className="font-semibold text-red-700">বাকি সংগ্রহ ({formatTaka(sale.due)})</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none"
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
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
            >
              সংগ্রহ করুন
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600"
          >
            বন্ধ
          </button>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="rounded-xl bg-emerald-600 py-2.5 font-bold text-white"
            >
              প্রিন্ট
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
