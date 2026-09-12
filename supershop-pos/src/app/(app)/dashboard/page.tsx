import Link from "next/link";
import { formatBdt } from "@/lib/money";
import { readStore } from "@/lib/store";

function isSameDay(iso: string, now = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default async function DashboardPage() {
  const store = await readStore();
  const todaySales = store.sales.filter((s) => isSameDay(s.createdAt));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const itemsSold = todaySales.reduce(
    (sum, s) => sum + s.lines.reduce((n, l) => n + l.qty, 0),
    0,
  );
  const lowStock = store.products
    .filter((p) => p.active && p.stock <= p.lowStockAt)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const stats = [
    {
      label: "Today's sales",
      value: formatBdt(todayRevenue, store.settings.currency),
    },
    { label: "Orders today", value: String(todaySales.length) },
    { label: "Items sold", value: String(itemsSold) },
    {
      label: "Active SKUs",
      value: String(store.products.filter((p) => p.active).length),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="anim-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl font-semibold md:text-5xl">
            Dashboard
          </h1>
          <p className="text-[var(--ink-soft)]/75">
            {store.settings.shopName} · {store.settings.address}
          </p>
        </div>
        <Link
          href="/pos"
          className="btn btn-lime rounded-2xl px-5 py-3 font-semibold"
        >
          Open POS
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`panel anim-rise rounded-[1.4rem] p-5 anim-delay-${i + 1}`}
          >
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]/60">
              {stat.label}
            </div>
            <div className="display mt-2 text-3xl font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel anim-rise rounded-[1.4rem] p-5">
          <h2 className="display text-2xl font-semibold">Low stock</h2>
          <div className="mt-4 space-y-2">
            {lowStock.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]/70">All shelves healthy.</p>
            ) : (
              lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--mist)] px-3 py-2.5"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--ink-soft)]/70">{p.sku}</div>
                  </div>
                  <div className="font-bold text-[var(--warn)]">{p.stock}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel anim-rise anim-delay-1 rounded-[1.4rem] p-5">
          <h2 className="display text-2xl font-semibold">Recent sales</h2>
          <div className="mt-4 space-y-2">
            {store.sales.slice(0, 6).length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]/70">
                No sales yet — open the POS to ring one up.
              </p>
            ) : (
              store.sales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--mist)] px-3 py-2.5"
                >
                  <div>
                    <div className="font-medium">{sale.invoiceNo}</div>
                    <div className="text-xs capitalize text-[var(--ink-soft)]/70">
                      {sale.paymentMethod} · {sale.cashier}
                    </div>
                  </div>
                  <div className="font-bold">
                    {formatBdt(sale.total, store.settings.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
