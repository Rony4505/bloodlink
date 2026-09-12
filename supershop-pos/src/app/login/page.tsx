"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [cashier, setCashier] = useState("Cashier");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, cashier }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }
      router.replace("/pos");
      router.refresh();
    });
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 md:px-8">
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <section className="anim-rise">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--leaf)]">
            Retail counter
          </p>
          <h1 className="display brand-mark text-6xl font-semibold text-[var(--ink)] md:text-8xl">
            LOOM
          </h1>
          <p className="mt-4 max-w-md text-lg text-[var(--ink-soft)]/85">
            Fast POS for clothing racks and supershop aisles — sell, stock, and
            close the day in one till.
          </p>
          <div className="mt-8 h-48 overflow-hidden rounded-[2rem] border border-[var(--line)] md:h-64">
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(120deg, #1d3b2f 0%, #2ea86a 45%, #c6f36b 100%)",
                backgroundSize: "200% 200%",
                animation: "pulse-soft 6s ease-in-out infinite",
              }}
            />
          </div>
        </section>

        <form
          onSubmit={onSubmit}
          className="panel anim-rise anim-delay-1 rounded-[1.8rem] p-6 md:p-8"
        >
          <h2 className="display text-3xl font-semibold">Open till</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]/75">
            Default PIN for demo: <strong>1234</strong>
          </p>

          <label className="mt-6 block text-sm font-medium">
            Cashier name
            <input
              className="field mt-2"
              value={cashier}
              onChange={(e) => setCashier(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            PIN
            <input
              className="field mt-2 tracking-[0.35em]"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-lime mt-6 w-full rounded-2xl px-4 py-3.5 text-base"
          >
            {pending ? "Opening…" : "Enter POS"}
          </button>
        </form>
      </div>
    </main>
  );
}
