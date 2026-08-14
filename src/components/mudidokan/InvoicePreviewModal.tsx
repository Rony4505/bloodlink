"use client";

import type { Sale } from "@/lib/mudidokan/types";
import { ReceiptContent } from "./ReceiptContent";

type Props = {
  sale: Sale;
  shopName: string;
  onPrint: () => void;
  onClose: () => void;
};

export function InvoicePreviewModal({ sale, shopName, onPrint, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="mb-4 text-center text-lg font-bold text-emerald-900">
          ইনভয়েস প্রিভিউ
        </h3>
        <ReceiptContent sale={sale} shopName={shopName} />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
          >
            প্রিন্ট
          </button>
        </div>
      </div>
    </div>
  );
}
