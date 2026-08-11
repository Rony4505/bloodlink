"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import { useCart } from "@/lib/fashion/cart-context";
import type { CheckoutForm, FashionOrder } from "@/lib/fashion/types";

const districts = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  district: "Dhaka",
  note: "",
  paymentMethod: "cod",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const shipping = subtotal >= 7000 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    const res = await fetch("/api/fashion/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form, items }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) return;

    const order = data.order as FashionOrder;
    sessionStorage.setItem("noore_last_order", JSON.stringify(order));
    clearCart();
    router.push(`/checkout/success?orderId=${order.id}`);
  }

  if (items.length === 0) {
    return (
      <FashionShell>
        <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">
            {copy.checkout.title}
          </h1>
          <p className="mt-4 text-lg text-[#6f554a]">{copy.cart.empty}</p>
          <div className="mt-8">
            <FashionButton href="/collections">{copy.actions.continueShopping}</FashionButton>
          </div>
        </section>
      </FashionShell>
    );
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
            {copy.checkout.title}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
            <Field label={copy.form.name} value={form.name} onChange={(value) => setForm((c) => ({ ...c, name: value }))} required />
            <Field label={copy.form.phone} value={form.phone} onChange={(value) => setForm((c) => ({ ...c, phone: value }))} required />
            <Field label={copy.form.email} value={form.email} onChange={(value) => setForm((c) => ({ ...c, email: value }))} type="email" />
            <Field label={copy.form.address} value={form.address} onChange={(value) => setForm((c) => ({ ...c, address: value }))} required multiline />
            <div>
              <label className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{copy.form.district}</label>
              <select className="field mt-2" value={form.district} onChange={(e) => setForm((c) => ({ ...c, district: e.target.value }))}>
                {districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <Field label={copy.form.note} value={form.note} onChange={(value) => setForm((c) => ({ ...c, note: value }))} multiline />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{copy.form.payment}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["cod", copy.form.cod],
                  ["bkash", copy.form.bkash],
                  ["nagad", copy.form.nagad],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, paymentMethod: value as CheckoutForm["paymentMethod"] }))}
                    className={`rounded-[1.25rem] border px-4 py-4 text-sm font-semibold transition ${
                      form.paymentMethod === value
                        ? "border-[#2b1d19] bg-[#2b1d19] text-white"
                        : "border-black/8 bg-[#faf4f0] text-[#5b4339]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/6 bg-[#2b1d19] p-6 text-white shadow-[0_30px_90px_rgba(48,27,20,0.18)]">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.cart.summary}</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.key} className="flex justify-between gap-4 text-sm text-white/78">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatBdt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-white/78">
              <div className="flex justify-between"><span>{copy.cart.subtotal}</span><span>{formatBdt(subtotal)}</span></div>
              <div className="flex justify-between"><span>{copy.cart.shipping}</span><span>{shipping === 0 ? "Free" : formatBdt(shipping)}</span></div>
              <div className="flex justify-between text-lg font-semibold text-white"><span>{copy.cart.total}</span><span>{formatBdt(total)}</span></div>
            </div>
            <div className="mt-8">
              <FashionButton type="submit" disabled={submitting}>
                {submitting ? "অর্ডার হচ্ছে..." : copy.actions.placeOrder}
              </FashionButton>
            </div>
          </aside>
        </form>
      </section>
    </FashionShell>
  );
}

function Field({ label, value, onChange, required, type = "text", multiline }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">{label}</label>
      {multiline ? (
        <textarea className="field mt-2 min-h-28 resize-y" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      ) : (
        <input className="field mt-2" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      )}
    </div>
  );
}
