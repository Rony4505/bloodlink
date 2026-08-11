"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder } from "@/lib/fashion/types";

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [orders, setOrders] = useState<FashionOrder[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/fashion/auth").then((r) => r.json()),
      fetch("/api/fashion/orders").then((r) => r.json()),
    ]).then(([auth, orderData]) => {
      if (!auth.customer) {
        router.push("/account/login");
        return;
      }
      setCustomer(auth.customer);
      setOrders(orderData.orders ?? []);
    });
  }, [router]);

  async function logout() {
    await fetch("/api/fashion/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!customer) return null;

  return (
    <FashionShell>
      <section className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">{copy.account.dashboardTitle}</h1>
            <p className="mt-2 text-[#6f554a]">{customer.name} · {customer.email}</p>
          </div>
          <FashionButton variant="secondary" onClick={logout}>{copy.nav.logout}</FashionButton>
        </div>

        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.account.ordersTitle}</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-[#6f554a]">{copy.account.noOrders}</p>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-[1.75rem] border border-black/6 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-[#8f624e]">{formatBdt(order.total)}</p>
                  </div>
                  <p className="mt-2 text-sm text-[#6f554a]">{new Date(order.createdAt).toLocaleString("bn-BD")}</p>
                  <p className="mt-2 text-sm text-[#6f554a]">{order.items.length} আইটেম · {order.status}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </FashionShell>
  );
}
