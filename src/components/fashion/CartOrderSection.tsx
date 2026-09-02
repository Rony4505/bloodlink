"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { formatBdt } from "@/lib/fashion/format";
import { useCart } from "@/lib/fashion/cart-context";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { bangladeshDistricts } from "@/lib/fashion/districts";
import type { CheckoutForm, FashionOrder } from "@/lib/fashion/types";

const districts = bangladeshDistricts.filter((d) => d !== "*");

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  district: "",
  note: "",
  paymentMethod: "cod",
  couponCode: "",
};

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{label}</span>
      {multiline ? (
        <textarea
          className="field mt-2 min-h-[88px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          className="field mt-2"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

export function CartOrderSection({
  subtotal,
}: {
  subtotal: number;
}) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { fc } = useFashionCopy();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [vipDiscount, setVipDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [message, setMessage] = useState("");
  const discount = couponDiscount + vipDiscount;
  const deliverySelected = Boolean(form.district?.trim());
  const orderTotal = Math.max(0, subtotal - discount) + (deliverySelected ? shipping : 0);

  const filteredDistricts = districts.filter((d) =>
    !districtSearch.trim()
      ? true
      : d.toLowerCase().includes(districtSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) {
          setForm((current) => ({
            ...current,
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch(`/api/fashion/vip?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((data) => {
        setVipDiscount(data.vip?.eligible ? data.vip.amount ?? 0 : 0);
      })
      .catch(() => setVipDiscount(0));
  }, [subtotal]);

  useEffect(() => {
    if (!form.district?.trim()) {
      setShipping(0);
      return;
    }

    fetch("/api/fashion/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district: form.district, subtotal: Math.max(0, subtotal - discount) }),
    })
      .then((r) => r.json())
      .then((data) => setShipping(Number(data.fee) || 0))
      .catch(() => setShipping(0));
  }, [form.district, subtotal, discount]);

  async function applyCoupon() {
    if (!form.couponCode?.trim()) return;
    const res = await fetch("/api/fashion/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.couponCode, subtotal }),
    });
    const data = await res.json();
    if (data.valid) {
      setCouponDiscount(data.discount);
      setCouponMessage(`${fc.cart.couponApplied}: ${data.coupon.code}`);
    } else {
      setCouponDiscount(0);
      setCouponMessage(data.error ?? fc.cart.couponInvalid);
    }
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setMessage("");
    const res = await fetch("/api/fashion/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form, items }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setMessage(data.error ?? fc.cart.orderFailed);
      return;
    }

    const order = data.order as FashionOrder;
    sessionStorage.setItem("scc_last_order", JSON.stringify(order));
    clearCart();
    router.push(`/checkout/success?orderId=${order.id}`);
  }

  return (
    <form onSubmit={handleConfirm} className="mt-10 space-y-6">
      <div className="rounded-[2rem] border border-[#e8c4b0]/50 bg-[linear-gradient(165deg,#fffaf7,#f5ebe3)] p-6 shadow-[0_20px_60px_rgba(48,27,20,0.06)]">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#2b1d19]">
          {fc.cart.summary}
        </h2>
        <div className="mt-5 space-y-3 text-[#5b4339]">
          <div className="flex justify-between">
            <span>{fc.cart.subtotal}</span>
            <span className="font-semibold">{formatBdt(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-[#8f624e]">
              <span>{fc.cart.discount}</span>
              <span className="font-semibold">-{formatBdt(discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>{fc.cart.shipping}</span>
            <span className="font-semibold">
              {!form.district?.trim()
                ? fc.cart.selectDeliveryArea
                : shipping === 0
                  ? fc.cart.freeDelivery
                  : formatBdt(shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#e8c4b0]/40 pt-3 text-lg font-bold text-[#2b1d19]">
            <span>{fc.cart.total}</span>
            <span>{formatBdt(orderTotal)}</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#8b6456]">{fc.cart.freeShipping}</p>
      </div>

      <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{fc.cart.deliveryInfo}</h2>
        <div className="mt-5 space-y-4">
          <Field label={fc.form.name} value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} required />
          <Field label={fc.form.phone} value={form.phone} onChange={(v) => setForm((c) => ({ ...c, phone: v }))} required />
          <Field label={fc.form.email} value={form.email} onChange={(v) => setForm((c) => ({ ...c, email: v }))} type="email" />
          <Field label={fc.form.address} value={form.address} onChange={(v) => setForm((c) => ({ ...c, address: v }))} required multiline />
          <div>
            <label className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{fc.form.district}</label>
            <input
              className="field mt-2"
              placeholder={fc.cart.districtSearch}
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
            />
            <select
              className="field mt-2"
              value={form.district}
              onChange={(e) => setForm((c) => ({ ...c, district: e.target.value }))}
              required
              size={Math.min(6, Math.max(4, filteredDistricts.length + 1))}
            >
              <option value="">{fc.checkout.selectDeliveryArea}</option>
              {filteredDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          <Field label={fc.form.note} value={form.note ?? ""} onChange={(v) => setForm((c) => ({ ...c, note: v }))} multiline />
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{fc.cart.coupon}</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field flex-1"
                placeholder={fc.cart.coupon}
                value={form.couponCode ?? ""}
                onChange={(e) => setForm((c) => ({ ...c, couponCode: e.target.value }))}
              />
              <FashionButton type="button" variant="secondary" onClick={() => void applyCoupon()}>
                {fc.cart.applyCoupon}
              </FashionButton>
            </div>
            {couponMessage ? <p className="mt-2 text-sm text-[#8b6456]">{couponMessage}</p> : null}
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{fc.form.payment}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(["cod", "bkash", "nagad"] as const).map((method) => (
                <label
                  key={method}
                  className={`cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${
                    form.paymentMethod === method
                      ? "border-[#8f624e] bg-[#faf0ea] text-[#8f624e]"
                      : "border-black/8 bg-[#faf4f0] text-[#5b4339]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={form.paymentMethod === method}
                    onChange={() => setForm((c) => ({ ...c, paymentMethod: method }))}
                  />
                  {method === "cod" ? fc.form.cod : method === "bkash" ? fc.form.bkash : fc.form.nagad}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null}

      <FashionButton type="submit" disabled={submitting} className="w-full justify-center py-4 text-base">
        {submitting ? fc.cart.ordering : fc.cart.confirmOrder}
      </FashionButton>
      <FashionButton href="/collections" variant="secondary" className="w-full justify-center">
        {fc.checkout.continueShopping}
      </FashionButton>
    </form>
  );
}
