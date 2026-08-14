"use client";

import { formatTaka } from "@/lib/mudidokan/format";

type Props = {
  total: number;
  paidInput: string;
  change: number;
  dueAmount: number;
  customerName: string;
  customerPhone: string;
  onPaidChange: (v: string) => void;
  onCustomerNameChange: (v: string) => void;
  onCustomerPhoneChange: (v: string) => void;
  onComplete: () => void;
  onClose: () => void;
  onClear: () => void;
};

export function CheckoutModal({
  total,
  paidInput,
  change,
  dueAmount,
  customerName,
  customerPhone,
  onPaidChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onComplete,
  onClose,
  onClear,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-emerald-900">বিক্রি সম্পন্ন</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-center">
          <p className="text-sm text-emerald-700">মোট বিল</p>
          <p className="text-3xl font-bold text-emerald-800">{formatTaka(total)}</p>
        </div>

        <label className="mb-3 block">
          <span className="text-sm font-medium text-slate-600">গ্রাহক দিয়েছে</span>
          <input
            type="number"
            placeholder="০"
            value={paidInput}
            onChange={(e) => onPaidChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-3 text-xl font-semibold outline-none focus:border-emerald-500"
            autoFocus
          />
        </label>

        {paidInput && change > 0 && (
          <div className="mb-3 flex justify-between rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-900">
            <span>ফেরত</span>
            <span>{formatTaka(change)}</span>
          </div>
        )}

        {dueAmount > 0 && (
          <>
            <div className="mb-3 flex justify-between rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
              <span>বাকি</span>
              <span>{formatTaka(dueAmount)}</span>
            </div>
            <input
              type="text"
              placeholder="গ্রাহকের নাম"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="mb-2 w-full rounded-xl border border-red-200 px-3 py-2 text-sm outline-none"
            />
            <input
              type="tel"
              placeholder="মোবাইল"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
            />
          </>
        )}

        <button
          type="button"
          onClick={onComplete}
          className="mb-2 w-full rounded-xl bg-emerald-600 py-3.5 text-lg font-bold text-white shadow-lg hover:bg-emerald-700"
        >
          বিক্রি সম্পন্ন
        </button>

        <button
          type="button"
          onClick={onClear}
          className="w-full text-center text-xs text-slate-500 hover:text-red-600"
        >
          বিল খালি করুন
        </button>
      </div>
    </div>
  );
}
