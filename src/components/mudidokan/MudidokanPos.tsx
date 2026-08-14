"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatTaka, formatTime, todayKey } from "@/lib/mudidokan/format";
import {
  addProduct,
  cartTotal,
  loadPosData,
  recordSale,
  removeProduct,
  updateShopName,
} from "@/lib/mudidokan/storage";
import type { CartLine, PosData, Product, Sale } from "@/lib/mudidokan/types";

type Tab = "sell" | "products" | "report";

function lineKey(productId: string) {
  return productId;
}

export function MudidokanPos() {
  const [data, setData] = useState<PosData | null>(null);
  const [tab, setTab] = useState<Tab>("sell");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [paidInput, setPaidInput] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [toast, setToast] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newUnit, setNewUnit] = useState("পিস");

  useEffect(() => {
    setData(loadPosData());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const paid = paidInput ? Number(paidInput) : 0;
  const change = Math.max(0, paid - total);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, search]);

  const todaySales = useMemo(() => {
    if (!data) return [];
    const key = todayKey();
    return data.sales.filter((s) => s.createdAt.slice(0, 10) === key);
  }, [data]);

  const todayTotal = useMemo(
    () => todaySales.reduce((sum, s) => sum + s.total, 0),
    [todaySales],
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const key = lineKey(product.id);
      const existing = prev.find((l) => l.productId === key);
      if (existing) {
        return prev.map((l) =>
          l.productId === key ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          qty: 1,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId ? { ...l, qty: l.qty + delta } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPaidInput("");
  }, []);

  const completeSale = useCallback(() => {
    if (!data || cart.length === 0) return;
    if (paid < total) {
      setToast("পর্যাপ্ত টাকা দিন");
      return;
    }
    const { data: next, sale } = recordSale(data, cart, paid);
    setData(next);
    setLastSale(sale);
    clearCart();
    setToast("বিক্রি সম্পন্ন!");
    setTimeout(() => {
      window.print();
    }, 150);
  }, [data, cart, paid, total, clearCart]);

  const handleAddProduct = useCallback(() => {
    if (!data) return;
    const price = Number(newPrice);
    if (!newName.trim() || !price || price <= 0) {
      setToast("নাম ও দাম দিন");
      return;
    }
    setData(addProduct(data, { name: newName, price, unit: newUnit }));
    setNewName("");
    setNewPrice("");
    setToast("পণ্য যোগ হয়েছে");
  }, [data, newName, newPrice, newUnit]);

  const handleRemoveProduct = useCallback(
    (id: string) => {
      if (!data) return;
      if (!confirm("এই পণ্য মুছবেন?")) return;
      setData(removeProduct(data, id));
      setToast("পণ্য মুছে ফেলা হয়েছে");
    },
    [data],
  );

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-50 text-emerald-900">
        <p className="text-lg font-medium">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-emerald-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <input
                type="text"
                value={data.settings.shopName}
                onChange={(e) => setData(updateShopName(data, e.target.value))}
                className="w-full max-w-xs border-none bg-transparent text-xl font-bold text-emerald-900 outline-none"
                aria-label="দোকানের নাম"
              />
              <p className="text-sm text-emerald-700">
                আজকের বিক্রি: {formatTaka(todayTotal)} ({todaySales.length}টি)
              </p>
            </div>
            <nav className="flex gap-2">
              {(
                [
                  ["sell", "বিক্রি"],
                  ["products", "পণ্য"],
                  ["report", "হিসাব"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    tab === key
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-4">
          {tab === "sell" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              {/* Products */}
              <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <input
                  type="search"
                  placeholder="পণ্য খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-emerald-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="flex min-h-[88px] flex-col items-start justify-between rounded-xl border-2 border-emerald-100 bg-emerald-50/50 p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-100 active:scale-[0.98]"
                    >
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">
                        {product.name}
                      </span>
                      <span className="mt-1 text-base font-bold text-emerald-700">
                        {formatTaka(product.price)}
                      </span>
                    </button>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-slate-500">কোনো পণ্য পাওয়া যায়নি</p>
                )}
              </section>

              {/* Cart */}
              <aside className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
                <h2 className="mb-3 text-lg font-bold text-emerald-900">বিল</h2>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      পণ্যে ক্লিক করুন
                    </p>
                  ) : (
                    cart.map((line) => (
                      <div
                        key={line.productId}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatTaka(line.price)} × {line.qty}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(line.productId, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-bold shadow-sm"
                            aria-label="কমান"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(line.productId, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white shadow-sm"
                            aria-label="বাড়ান"
                          >
                            +
                          </button>
                        </div>
                        <span className="w-16 text-right text-sm font-bold">
                          {formatTaka(line.price * line.qty)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>মোট</span>
                    <span className="text-emerald-700">{formatTaka(total)}</span>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-600">গ্রাহক দিয়েছে</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="০"
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-500"
                    />
                  </label>

                  {paidInput && (
                    <div className="flex justify-between rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-900">
                      <span>ফেরত</span>
                      <span>{formatTaka(change)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      disabled={cart.length === 0}
                      className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 disabled:opacity-40"
                    >
                      খালি
                    </button>
                    <button
                      type="button"
                      onClick={completeSale}
                      disabled={cart.length === 0}
                      className="rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-40"
                    >
                      বিক্রি সম্পন্ন
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {tab === "products" && (
            <section className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">নতুন পণ্য যোগ করুন</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="পণ্যের নাম (যেমন: চাল ১ কেজি)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="দাম (৳)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-500"
                  >
                    {["পিস", "কেজি", "লিটার", "প্যাকেট", "হালি", "গ্রাম"].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
                >
                  যোগ করুন
                </button>
              </div>

              <h3 className="mb-2 mt-8 font-bold">সব পণ্য ({data.products.length})</h3>
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                {data.products.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatTaka(p.price)} / {p.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(p.id)}
                      className="rounded-lg px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      মুছুন
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "report" && (
            <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">আজকের মোট বিক্রি</p>
                  <p className="text-2xl font-bold text-emerald-900">{formatTaka(todayTotal)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">আজকের বিল সংখ্যা</p>
                  <p className="text-2xl font-bold text-emerald-900">{todaySales.length}টি</p>
                </div>
              </div>

              <h3 className="mb-3 font-bold">আজকের বিক্রির তালিকা</h3>
              {todaySales.length === 0 ? (
                <p className="text-slate-500">আজ এখনো কোনো বিক্রি নেই</p>
              ) : (
                <ul className="space-y-2">
                  {[...todaySales].reverse().map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{formatTaka(sale.total)}</p>
                        <p className="text-xs text-slate-500">
                          {formatTime(sale.createdAt)} · {sale.items.length}টি পণ্য
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLastSale(sale);
                          setTimeout(() => window.print(), 100);
                        }}
                        className="text-sm font-medium text-emerald-700 hover:underline"
                      >
                        রসিদ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-xl">
            {toast}
          </div>
        )}

        {/* Printable receipt */}
        <div id="pos-receipt" ref={receiptRef} className="hidden print:block">
          {lastSale && (
            <div>
              <h1 className="text-center text-base font-bold">{data.settings.shopName}</h1>
              <p className="text-center text-xs">
                {formatDate(lastSale.createdAt)} · {formatTime(lastSale.createdAt)}
              </p>
              <hr className="my-2 border-dashed border-black" />
              {lastSale.items.map((line) => (
                <div key={line.productId} className="flex justify-between text-xs">
                  <span>
                    {line.name} × {line.qty}
                  </span>
                  <span>{formatTaka(line.price * line.qty)}</span>
                </div>
              ))}
              <hr className="my-2 border-dashed border-black" />
              <div className="flex justify-between font-bold">
                <span>মোট</span>
                <span>{formatTaka(lastSale.total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>পেয়েছি</span>
                <span>{formatTaka(lastSale.paid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>ফেরত</span>
                <span>{formatTaka(lastSale.change)}</span>
              </div>
              <p className="mt-3 text-center text-xs">ধন্যবাদ!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
