"use client";

import Link from "next/link";
import { ProductImage } from "@/components/fashion/ProductImage";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { CartItem } from "@/lib/fashion/types";

export function OrderInformationTable({
  items,
  subtotal,
  shipping,
  discount = 0,
  deliveryAreaSelected = false,
  onRemove,
  onUpdateQuantity,
}: {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  deliveryAreaSelected?: boolean;
  onRemove: (key: string) => void;
  onUpdateQuantity: (key: string, quantity: number) => void;
}) {
  const grandTotal = Math.max(0, subtotal - discount) + shipping;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8d4e8]/60 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e8d4e8]/50 bg-[#faf4f8] px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[#5c3d5e]">
          Order Information
        </h2>
        <span className="rounded-full bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] px-2.5 py-0.5 text-xs font-bold text-white">
          {items.length} Items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-[#e8d4e8]/40 bg-[#fdf8fb] text-left text-[11px] font-bold uppercase tracking-wide text-[#8a7490]">
              <th className="px-3 py-2.5 w-12">Delete</th>
              <th className="px-3 py-2.5">Product</th>
              <th className="px-3 py-2.5 w-28 text-center">Quantity</th>
              <th className="px-3 py-2.5 w-24 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-b border-[#e8d4e8]/30 align-middle">
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[#b44a4a] hover:bg-red-50"
                    onClick={() => onRemove(item.key)}
                    aria-label={`Remove ${item.name}`}
                  >
                    🗑
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <ProductImage src={item.imageUrl} alt={item.name} className="h-14 w-14 shrink-0" />
                    ) : (
                      <div className={`h-14 w-14 shrink-0 rounded-xl ${item.tone}`} />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-semibold text-[#4a3348] hover:text-[#5c3d5e]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#8a7490]">
                        Variant: {item.size}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="mx-auto inline-flex items-center rounded-lg border border-[#e8d4e8]/60 bg-[#faf4f8]">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-base"
                      onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-base"
                      onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-[#5c3d5e]">
                  {formatBdt(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#e8d4e8]/40">
              <td colSpan={3} className="px-4 py-2.5 text-right font-medium text-[#6e5870]">
                {copy.cart.subtotal}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold">{formatBdt(subtotal)}</td>
            </tr>
            {discount > 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium text-[#8f624e]">
                  {copy.cart.discount}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-[#8f624e]">
                  -{formatBdt(discount)}
                </td>
              </tr>
            ) : null}
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right font-medium text-[#6e5870]">
                {copy.cart.shipping}
              </td>
              <td className="px-4 py-2 text-right font-semibold">
                {!deliveryAreaSelected
                  ? formatBdt(0)
                  : shipping === 0
                    ? "Free"
                    : formatBdt(shipping)}
              </td>
            </tr>
            <tr className="bg-[#faf0f5]">
              <td colSpan={3} className="px-4 py-3 text-right text-base font-bold text-[#5c3d5e]">
                Grand Total
              </td>
              <td className="px-4 py-3 text-right text-base font-bold text-[#5c3d5e]">
                {formatBdt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
