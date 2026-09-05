import { formatBdt } from "@/lib/money";
import { readStore } from "@/lib/store";

export default async function SalesPage() {
  const store = await readStore();

  return (
    <div>
      <div className="mb-4 anim-rise">
        <h1 className="display text-4xl font-semibold md:text-5xl">Sales</h1>
        <p className="text-[var(--ink-soft)]/75">
          Invoice history for today and past tills.
        </p>
      </div>

      <section className="panel anim-rise rounded-[1.5rem] p-4 md:p-5">
        {store.sales.length === 0 ? (
          <p className="px-2 py-10 text-center text-[var(--ink-soft)]/70">
            No invoices yet.
          </p>
        ) : (
          <div className="space-y-3">
            {store.sales.map((sale) => (
              <article
                key={sale.id}
                className="rounded-2xl border border-[var(--line)] bg-white/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{sale.invoiceNo}</h2>
                    <p className="text-xs text-[var(--ink-soft)]/70">
                      {new Date(sale.createdAt).toLocaleString("en-BD")} ·{" "}
                      {sale.cashier} ·{" "}
                      <span className="capitalize">{sale.paymentMethod}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="display text-2xl font-semibold text-[var(--leaf)]">
                      {formatBdt(sale.total, store.settings.currency)}
                    </div>
                    {sale.discount > 0 ? (
                      <div className="text-xs text-[var(--ink-soft)]/70">
                        Discount {formatBdt(sale.discount, store.settings.currency)}
                      </div>
                    ) : null}
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-[var(--line)] pt-3 text-sm">
                  {sale.lines.map((line, idx) => (
                    <li
                      key={`${sale.id}-${idx}`}
                      className="flex justify-between gap-3"
                    >
                      <span>
                        {line.qty}× {line.name}
                        {line.size || line.color
                          ? ` (${[line.size, line.color].filter(Boolean).join("/")})`
                          : ""}
                      </span>
                      <span>
                        {formatBdt(line.qty * line.unitPrice, store.settings.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
