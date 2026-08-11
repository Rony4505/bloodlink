"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder, UserNotification } from "@/lib/fashion/types";

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/fashion/auth").then((r) => r.json()),
      fetch("/api/fashion/orders").then((r) => r.json()),
      fetch("/api/fashion/notifications").then((r) => r.json()),
    ]).then(([auth, orderData, notifData]) => {
      if (!auth.customer) {
        router.push("/account/login");
        return;
      }
      setCustomer(auth.customer);
      setOrders(orderData.orders ?? []);
      setNotifications(notifData.notifications ?? []);
    });
  }, [router]);

  async function logout() {
    await fetch("/api/fashion/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function markRead(id: string) {
    await fetch("/api/fashion/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((current) =>
      current.map((n) =>
        n.id === id && customer ? { ...n, readBy: [...n.readBy, customer.id] } : n,
      ),
    );
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
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.account.notificationsTitle}</h2>
          {notifications.length === 0 ? (
            <p className="mt-4 text-[#6f554a]">{copy.account.noNotifications}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 10).map((n) => {
                const unread = !n.readBy.includes(customer.id);
                return (
                  <article
                    key={n.id}
                    className={`rounded-2xl border p-4 ${unread ? "border-[#d4b896]/50 bg-[#faf0ea]" : "border-black/6 bg-white"}`}
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-1 text-sm text-[#6f554a]">{n.body}</p>
                    {unread ? (
                      <button type="button" className="mt-2 text-xs font-semibold text-[#8f624e]" onClick={() => markRead(n.id)}>
                        পড়েছি
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
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
                  <p className="mt-2 text-sm font-medium text-[#8b6456]">
                    {copy.account.orderStatus}: {copy.orderStatus[order.status]}
                  </p>
                  {order.statusHistory?.length ? (
                    <ul className="mt-3 space-y-1 border-t border-black/5 pt-3 text-xs text-[#8b6456]">
                      {order.statusHistory.map((h, i) => (
                        <li key={i}>
                          {new Date(h.updatedAt).toLocaleString("bn-BD")} — {h.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </FashionShell>
  );
}
