"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { OrderInformationTable } from "@/components/fashion/OrderInformationTable";
import { copy } from "@/lib/fashion/copy";
import {
  clearCheckoutDraft,
  readCheckoutDraft,
  writeCheckoutDraft,
} from "@/lib/fashion/checkout-draft";
import { useCart } from "@/lib/fashion/cart-context";
import { bangladeshDistricts } from "@/lib/fashion/districts";
import type { CheckoutForm, FashionOrder } from "@/lib/fashion/types";

const districts = bangladeshDistricts.filter((d) => d !== "*");

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  district: "Dhaka",
  note: "",
  paymentMethod: "cod",
  couponCode: "",
};

function IconField({
  icon,
  label,
  value,
  onChange,
  required,
  type = "text",
  multiline,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#5c4860]">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
      {multiline ? (
        <textarea
          className="field min-h-[88px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          className="field"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

export function CheckoutOrderFlow({ compactTitle = false }: { compactTitle?: boolean }) {
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(() => ({
    ...initialForm,
    ...readCheckoutDraft(),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState(120);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [vipDiscount, setVipDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [message, setMessage] = useState("");
  const discount = couponDiscount + vipDiscount;

  useEffect(() => {
    writeCheckoutDraft(form);
  }, [form]);

  useEffect(() => {
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) {
          setForm((current) => ({
            ...current,
            name: current.name || data.customer.name,
            phone: current.phone || data.customer.phone,
            email: current.email || data.customer.email,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch(`/api/fashion/vip?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((data) => setVipDiscount(data.vip?.eligible ? data.vip.amount ?? 0 : 0))
      .catch(() => setVipDiscount(0));
  }, [subtotal]);

  useEffect(() => {
    fetch("/api/fashion/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district: form.district, subtotal: Math.max(0, subtotal - discount) }),
    })
      .then((r) => r.json())
      .then((data) => setShipping(data.fee ?? 120))
      .catch(() => setShipping(120));
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
      setCouponMessage(`কুপন প্রয়োগ: ${data.coupon.code}`);
    } else {
      setCouponDiscount(0);
      setCouponMessage(data.error ?? "কুপন সঠিক নয়");
    }
  }

  async function handleSubmit(event: FormEvent) {
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
      setMessage(data.error ?? "অর্ডার করা যায়নি");
      return;
    }

    const order = data.order as FashionOrder;
    sessionStorage.setItem("scc_last_order", JSON.stringify(order));
    clearCheckoutDraft();
    clearCart();
    router.push(`/checkout/success?orderId=${order.id}`);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-black/6 bg-white p-10 text-center shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
        <p className="text-lg text-[#6f554a]">{copy.cart.empty}</p>
        <div className="mt-6">
          <FashionButton href="/collections">{copy.actions.continueShopping}</FashionButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!compactTitle ? (
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          {copy.checkout.title}
        </h1>
      ) : null}

      <OrderInformationTable
        items={items}
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        onRemove={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      <p className="rounded-xl border border-[#e8c4d8]/50 bg-[#faf0f5] px-4 py-3 text-sm font-medium text-[#5c3d5e]">
        To confirm your order, fill in the information and click the &apos;Order&apos; button.
      </p>

      <div className="space-y-4 rounded-2xl border border-[#e8d4e8]/60 bg-white p-5 shadow-sm">
        <IconField
          icon="👤"
          label={`${copy.form.name} *`}
          value={form.name}
          onChange={(v) => setForm((c) => ({ ...c, name: v }))}
          required
        />
        <IconField
          icon="📞"
          label={`${copy.form.phone} *`}
          value={form.phone}
          onChange={(v) => setForm((c) => ({ ...c, phone: v }))}
          required
        />
        <IconField
          icon="📍"
          label={`${copy.form.address} *`}
          value={form.address}
          onChange={(v) => setForm((c) => ({ ...c, address: v }))}
          required
          multiline
        />
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#5c4860]">
            <span aria-hidden>📍</span>
            Select delivery area *
          </span>
          <select
            className="field"
            value={form.district}
            onChange={(e) => setForm((c) => ({ ...c, district: e.target.value }))}
            required
          >
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-semibold text-[#5c4860]">{copy.cart.coupon}</p>
          <div className="mt-2 flex gap-2">
            <input
              className="field flex-1"
              placeholder="কুপন কোড"
              value={form.couponCode ?? ""}
              onChange={(e) => setForm((c) => ({ ...c, couponCode: e.target.value }))}
            />
            <FashionButton type="button" variant="secondary" onClick={() => void applyCoupon()}>
              {copy.actions.apply}
            </FashionButton>
          </div>
          {couponMessage ? <p className="mt-2 text-sm text-[#8b6456]">{couponMessage}</p> : null}
        </div>
      </div>

      {message ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] px-5 py-4 text-base font-bold text-white shadow-md disabled:opacity-55"
      >
        {submitting ? "অর্ডার হচ্ছে..." : copy.actions.placeOrder}
      </button>
    </form>
  );
}
