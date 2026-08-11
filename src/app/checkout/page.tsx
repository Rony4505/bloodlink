"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { formatBdt } from "@/lib/fashion/format";
import { useCart } from "@/lib/fashion/cart-context";
import type { CheckoutForm } from "@/lib/fashion/types";

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    clearCart();
    router.push("/checkout/success");
    setSubmitting(false);
  }

  if (items.length === 0) {
    return (
      <FashionShell>
        <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">
            Checkout
          </h1>
          <p className="mt-4 text-lg text-[#6f554a]">
            Add products to your cart before checking out.
          </p>
          <div className="mt-8">
            <FashionButton href="/collections">Browse collections</FashionButton>
          </div>
        </section>
      </FashionShell>
    );
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
            Checkout
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
            Complete your order
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-5 rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_24px_80px_rgba(48,27,20,0.06)]">
            <Field
              label="Full name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <Field
              label="Phone number"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              required
            />
            <Field
              label="Email (optional)"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              type="email"
            />
            <Field
              label="Delivery address"
              value={form.address}
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
              required
              multiline
            />
            <div>
              <label className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
                District
              </label>
              <select
                className="field mt-2"
                value={form.district}
                onChange={(event) =>
                  setForm((current) => ({ ...current, district: event.target.value }))
                }
              >
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Order note (optional)"
              value={form.note}
              onChange={(value) => setForm((current) => ({ ...current, note: value }))}
              multiline
            />

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
                Payment method
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["cod", "Cash on Delivery"],
                  ["bkash", "bKash"],
                  ["nagad", "Nagad"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        paymentMethod: value as CheckoutForm["paymentMethod"],
                      }))
                    }
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
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              Order summary
            </h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.key} className="flex justify-between gap-4 text-sm text-white/78">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatBdt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-white/78">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatBdt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatBdt(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>{formatBdt(total)}</span>
              </div>
            </div>
            <div className="mt-8">
              <FashionButton type="submit" disabled={submitting}>
                {submitting ? "Placing order..." : "Place order"}
              </FashionButton>
            </div>
          </aside>
        </form>
      </section>
    </FashionShell>
  );
}

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
    <div>
      <label className="text-sm font-medium uppercase tracking-[0.2em] text-[#9b7766]">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="field mt-2 min-h-28 resize-y"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
      ) : (
        <input
          className="field mt-2"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
        />
      )}
    </div>
  );
}
