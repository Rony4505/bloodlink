"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder } from "@/lib/fashion/types";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [tracking, setTracking] = useState("");
  const [order, setOrder] = useState<FashionOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchTrack(code: string) {
    setError("");
    setOrder(null);
    const res = await fetch(`/api/fashion/track?tracking=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "অর্ডার পাওয়া যায়নি");
      return;
    }
    setOrder(data.order);
  }

  useEffect(() => {
    const q = searchParams.get("tracking");
    if (q?.trim()) {
      setTracking(q);
      void fetchTrack(q.trim());
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await fetchTrack(tracking.trim());
    setLoading(false);
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">অর্ডার ট্র্যাক করুন</h1>
        <p className="mt-3 text-[#6f554a]">অর্ডার confirm-এর পর পাওয়া tracking number দিন</p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
          <input
            className="field flex-1"
            placeholder="Tracking number (যেমন SG12345678ABCD)"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            required
          />
          <FashionButton type="submit" disabled={loading}>
            {loading ? "..." : "ট্র্যাক"}
          </FashionButton>
        </form>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        {order ? (
          <article className="mt-8 rounded-[2rem] border border-[#e8c4b0]/50 bg-white p-6 shadow-lg">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm text-[#9b7766]">Tracking Number</p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#8f624e]">
                  {order.trackingNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#9b7766]">Order ID</p>
                <p className="font-semibold">{order.id}</p>
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold">{copy.orderStatus[order.status]}</p>
            <p className="text-sm text-[#6f554a]">{order.customerName} · {formatBdt(order.total)}</p>
            <ul className="mt-6 space-y-3 border-t border-black/5 pt-4">
              {order.statusHistory?.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e8b896]" />
                  <div>
                    <p className="font-medium">{h.message}</p>
                    <p className="text-xs text-[#a0897d]">
                      {new Date(h.updatedAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>
    </FashionShell>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
