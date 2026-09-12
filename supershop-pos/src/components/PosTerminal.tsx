"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatBdt } from "@/lib/money";
import type { PaymentMethod, Product, Sale } from "@/lib/types";
import { ProductSwatch } from "./ProductSwatch";

type CartItem = {
  key: string;
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  size?: string;
  color?: string;
  maxStock: number;
};

type Props = {
  products: Product[];
  currency: string;
};

export function PosTerminal({ products: initialProducts, currency }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
      );
    });
  }, [products, deferredQuery, category]);

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("pos-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openProduct(product: Product) {
    setSelected(product);
    setSize(product.sizes[0] || "");
    setColor(product.colors[0] || "");
    setError("");
  }

  function addSelected() {
    if (!selected) return;
    if (selected.sizes.length && !size) {
      setError("Pick a size");
      return;
    }
    if (selected.colors.length && !color) {
      setError("Pick a color");
      return;
    }
    if (selected.stock < 1) {
      setError("Out of stock");
      return;
    }

    const key = `${selected.id}|${size}|${color}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        if (existing.qty + 1 > selected.stock) return prev;
        return prev.map((l) =>
          l.key === key ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: selected.id,
          name: selected.name,
          sku: selected.sku,
          unitPrice: selected.price,
          qty: 1,
          size: size || undefined,
          color: color || undefined,
          maxStock: selected.stock,
        },
      ];
    });
    setSelected(null);
    setError("");
  }

  function updateQty(key: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.key === key
            ? { ...l, qty: Math.min(Math.max(qty, 0), l.maxStock) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function checkout() {
    if (!cart.length) return;
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            size: l.size,
            color: l.color,
          })),
          discount: Number(discount) || 0,
          paymentMethod,
          cashReceived:
            paymentMethod === "cash"
              ? Number(cashReceived || total)
              : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }
      setReceipt(data.sale);
      setCart([]);
      setDiscount(0);
      setCashReceived("");
      const refreshed = await fetch("/api/products");
      if (refreshed.ok) {
        const body = await refreshed.json();
        setProducts(body.products);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
      <section className="panel anim-rise rounded-[1.6rem] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            id="pos-search"
            className="field flex-1"
            placeholder="Search name, SKU, barcode… (F2)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <select
            className="field md:w-44"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="group rounded-2xl border border-[var(--line)] bg-white/70 p-2 text-left transition hover:-translate-y-0.5 hover:border-[var(--leaf)] hover:shadow-lg"
            >
              <ProductSwatch
                name={product.name}
                hue={product.imageHue}
                className="aspect-[4/3] w-full"
              />
              <div className="mt-2 px-1">
                <div className="line-clamp-2 text-sm font-semibold leading-snug">
                  {product.name}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[var(--ink-soft)]/70">
                  <span>{product.sku}</span>
                  <span
                    className={
                      product.stock <= product.lowStockAt
                        ? "text-[var(--warn)]"
                        : ""
                    }
                  >
                    {product.stock} left
                  </span>
                </div>
                <div className="mt-1 text-sm font-bold text-[var(--leaf)]">
                  {formatBdt(product.price, currency)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel anim-rise anim-delay-1 flex flex-col rounded-[1.6rem] p-4 md:p-5">
        <div className="flex items-end justify-between">
          <h2 className="display text-3xl font-semibold">Cart</h2>
          <button
            type="button"
            className="btn btn-ghost rounded-full px-3 py-1.5 text-xs"
            onClick={() => setCart([])}
          >
            Clear
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="rounded-2xl bg-[var(--mist)] px-4 py-8 text-center text-sm text-[var(--ink-soft)]/70">
              Tap a product to start selling.
            </p>
          ) : (
            cart.map((line) => (
              <div
                key={line.key}
                className="rounded-2xl border border-[var(--line)] bg-white/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{line.name}</div>
                    <div className="text-xs text-[var(--ink-soft)]/70">
                      {[line.size, line.color].filter(Boolean).join(" · ") ||
                        line.sku}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatBdt(line.unitPrice * line.qty, currency)}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost h-8 w-8 rounded-full"
                    onClick={() => updateQty(line.key, line.qty - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-semibold">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost h-8 w-8 rounded-full"
                    onClick={() => updateQty(line.key, line.qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            Discount
            <input
              className="field w-32"
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {(["cash", "card", "bkash", "nagad"] as PaymentMethod[]).map(
              (method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl px-3 py-2 text-sm capitalize ${
                    paymentMethod === method
                      ? "bg-[var(--ink)] text-[var(--lime)]"
                      : "bg-[var(--mist)]"
                  }`}
                >
                  {method}
                </button>
              ),
            )}
          </div>

          {paymentMethod === "cash" ? (
            <label className="flex items-center justify-between gap-3 text-sm">
              Cash received
              <input
                className="field w-32"
                type="number"
                min={0}
                value={cashReceived}
                onChange={(e) =>
                  setCashReceived(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder={String(total)}
              />
            </label>
          ) : null}

          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-soft)]/60">
                Total
              </div>
              <div className="display text-4xl font-semibold text-[var(--leaf)]">
                {formatBdt(total, currency)}
              </div>
            </div>
            {paymentMethod === "cash" && cashReceived !== "" ? (
              <div className="text-right text-sm">
                Change
                <div className="font-bold">
                  {formatBdt(Math.max(0, Number(cashReceived) - total), currency)}
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <button
            type="button"
            disabled={!cart.length || pending}
            onClick={checkout}
            className="btn btn-primary w-full rounded-2xl py-3.5 text-base font-semibold disabled:opacity-50"
          >
            {pending ? "Processing…" : "Complete sale"}
          </button>
        </div>
      </aside>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(16,36,28,0.45)] p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md rounded-[1.6rem] p-5">
            <div className="flex gap-3">
              <ProductSwatch
                name={selected.name}
                hue={selected.imageHue}
                className="h-20 w-20 shrink-0"
              />
              <div>
                <h3 className="display text-2xl font-semibold">{selected.name}</h3>
                <p className="text-sm text-[var(--ink-soft)]/70">
                  {formatBdt(selected.price, currency)} · {selected.stock} in stock
                </p>
              </div>
            </div>

            {selected.sizes.length ? (
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium">Size</div>
                <div className="flex flex-wrap gap-2">
                  {selected.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        size === s
                          ? "bg-[var(--ink)] text-[var(--lime)]"
                          : "bg-[var(--mist)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selected.colors.length ? (
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium">Color</div>
                <div className="flex flex-wrap gap-2">
                  {selected.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        color === c
                          ? "bg-[var(--ink)] text-[var(--lime)]"
                          : "bg-[var(--mist)]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-2xl py-3"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-lime flex-1 rounded-2xl py-3"
                onClick={addSelected}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {receipt ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(16,36,28,0.45)] p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md rounded-[1.6rem] p-5">
            <h3 className="display text-3xl font-semibold">Sale complete</h3>
            <p className="text-sm text-[var(--ink-soft)]/70">
              Invoice {receipt.invoiceNo}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {receipt.lines.map((line, i) => (
                <div key={`${line.productId}-${i}`} className="flex justify-between gap-3">
                  <span>
                    {line.qty}× {line.name}
                    {line.size || line.color
                      ? ` (${[line.size, line.color].filter(Boolean).join("/")})`
                      : ""}
                  </span>
                  <span>{formatBdt(line.qty * line.unitPrice, currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatBdt(receipt.total, currency)}</span>
            </div>
            <div className="mt-5 flex gap-2 no-print">
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-2xl py-3"
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 rounded-2xl py-3"
                onClick={() => setReceipt(null)}
              >
                New sale
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
