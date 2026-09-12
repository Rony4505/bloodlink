"use client";

import { FormEvent, useState, useTransition } from "react";

type Settings = {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  currency: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState({ ...initial, pin: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      const payload: Record<string, string> = {
        shopName: form.shopName,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        currency: form.currency,
      };
      if (form.pin.trim()) payload.pin = form.pin.trim();

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setForm((prev) => ({ ...prev, ...data.settings, pin: "" }));
      setMessage("Settings saved");
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="panel anim-rise max-w-xl rounded-[1.5rem] p-5 md:p-6"
    >
      <h2 className="display text-2xl font-semibold">Shop profile</h2>
      <div className="mt-4 grid gap-3">
        <label className="text-sm">
          Shop name
          <input
            className="field mt-1"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Tagline
          <input
            className="field mt-1"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Address
          <input
            className="field mt-1"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Phone
          <input
            className="field mt-1"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Currency
          <input
            className="field mt-1"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          New PIN (optional)
          <input
            className="field mt-1"
            type="password"
            inputMode="numeric"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            placeholder="Leave blank to keep current"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-[var(--leaf)]">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary mt-5 rounded-2xl px-5 py-3 font-semibold"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
