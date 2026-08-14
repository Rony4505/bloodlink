"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckoutModal } from "@/components/mudidokan/CheckoutModal";
import { DigitalScale } from "@/components/mudidokan/DigitalScale";
import { InvoiceDetailsModal } from "@/components/mudidokan/InvoiceDetailsModal";
import { PosLockModal } from "@/components/mudidokan/PosLockModal";
import { ProductCartPanel } from "@/components/mudidokan/ProductCartPanel";
import { ReceiptContent } from "@/components/mudidokan/ReceiptContent";
import {
  cartTotal,
  formatDate,
  formatTaka,
  formatTime,
  textOnColor,
  todayKey,
} from "@/lib/mudidokan/format";
import { PRODUCT_COLOR_PRESETS } from "@/lib/mudidokan/seed";
import {
  addProduct,
  collectDue,
  collectionReportForDate,
  collectionsTotalForDate,
  findProductByBarcode,
  loadPosData,
  productReportForDate,
  profitForDate,
  recordSale,
  removeProduct,
  salesForDate,
  updateShopName,
} from "@/lib/mudidokan/storage";
import type { CartLine, PosData, Product, Sale } from "@/lib/mudidokan/types";
import { useWeightScale } from "@/lib/mudidokan/use-weight-scale";
import { isWeightUnit } from "@/lib/mudidokan/units";

type Tab = "sell" | "products" | "report";
type ReportTab = "sales" | "products";
type LockTarget = "products" | "report" | null;

function newLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Convert entered grams to stored weight for cart line. */
function weightForProduct(grams: number, unit: string): number {
  if (grams <= 0) return 0;
  if (unit === "গ্রাম") return grams;
  return grams / 1000;
}

export function MudidokanPos() {
  const scale = useWeightScale();
  const [data, setData] = useState<PosData | null>(null);
  const [tab, setTab] = useState<Tab>("sell");
  const [reportTab, setReportTab] = useState<ReportTab>("sales");
  const [reportDate, setReportDate] = useState(todayKey());
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [lockTarget, setLockTarget] = useState<LockTarget>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [paidInput, setPaidInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [toast, setToast] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newUnit, setNewUnit] = useState("পিস");
  const [newColor, setNewColor] = useState(PRODUCT_COLOR_PRESETS[0]);
  const [newBarcode, setNewBarcode] = useState("");

  useEffect(() => {
    setData(loadPosData());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const paid = paidInput ? Number(paidInput) : 0;
  const change = Math.max(0, paid - total);
  const dueAmount = Math.max(0, total - paid);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)),
    );
  }, [data, search]);

  const dateSales = useMemo(
    () => (data ? salesForDate(data, reportDate) : []),
    [data, reportDate],
  );
  const dateTotal = useMemo(
    () => dateSales.reduce((s, sale) => s + sale.total, 0),
    [dateSales],
  );
  const dateDueTotal = useMemo(
    () => dateSales.reduce((s, sale) => s + sale.due, 0),
    [dateSales],
  );
  const dateCollections = useMemo(
    () => (data ? collectionsTotalForDate(data, reportDate) : 0),
    [data, reportDate],
  );
  const dateProfit = useMemo(
    () => (data ? profitForDate(data, reportDate) : 0),
    [data, reportDate],
  );
  const productReport = useMemo(
    () => (data ? productReportForDate(data, reportDate) : []),
    [data, reportDate],
  );
  const collectionRows = useMemo(
    () => (data ? collectionReportForDate(data, reportDate) : []),
    [data, reportDate],
  );

  const addToCart = useCallback(
    (product: Product) => {
      if (isWeightUnit(product.unit)) {
        const w = weightForProduct(scale.weightGrams, product.unit);
        if (w <= 0) {
          setToast("ওজন লিখুন");
          return;
        }
        setCart((prev) => [
          ...prev,
          {
            lineId: newLineId(),
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            qty: 1,
            weight: w,
          },
        ]);
        setToast(`${product.name} যোগ হয়েছে`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find(
          (l) => l.productId === product.id && l.weight == null,
        );
        if (existing) {
          return prev.map((l) =>
            l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        return [
          ...prev,
          {
            lineId: newLineId(),
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            qty: 1,
          },
        ];
      });
      setToast(`${product.name} যোগ হয়েছে`);
    },
    [scale.weightGrams],
  );

  const addByBarcode = useCallback(
    (code: string) => {
      if (!data) return;
      const product = findProductByBarcode(data.products, code);
      if (!product) {
        setToast("কোড মিলছে না");
        return;
      }
      addToCart(product);
    },
    [data, addToCart],
  );

  useEffect(() => {
    if (tab !== "sell") return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "Enter" && scanBufferRef.current.length >= 3) {
        addByBarcode(scanBufferRef.current);
        scanBufferRef.current = "";
        e.preventDefault();
        return;
      }

      if (e.key.length === 1 && /[\dA-Za-z]/.test(e.key)) {
        scanBufferRef.current += e.key;
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          scanBufferRef.current = "";
        }, 120);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tab, addByBarcode]);

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPaidInput("");
    setCustomerName("");
    setCustomerPhone("");
    setCheckoutOpen(false);
  }, []);

  const completeSale = useCallback(() => {
    if (!data || cart.length === 0) return;
    const { data: next, sale } = recordSale(data, {
      items: cart,
      paid,
      customerName,
      customerPhone,
    });
    setData(next);
    setLastSale(sale);
    clearCart();
    setCheckoutOpen(false);
    setToast("বিক্রি সম্পন্ন!");
  }, [data, cart, paid, customerName, customerPhone, clearCart]);

  const handleCollectDue = useCallback(
    (amount: number, note?: string) => {
      if (!data || !detailSale) return;
      const result = collectDue(data, detailSale.id, amount, note);
      if (!result) {
        setToast("সংগ্রহ হয়নি");
        return;
      }
      setData(result.data);
      setDetailSale(result.sale);
      setToast("বাকি সংগ্রহ হয়েছে");
    },
    [data, detailSale],
  );

  const handleAddProduct = useCallback(() => {
    if (!data) return;
    const price = Number(newPrice);
    const cost = Number(newCost);
    if (!newName.trim() || !price || price <= 0) {
      setToast("নাম ও দাম দিন");
      return;
    }
    setData(
      addProduct(data, {
        name: newName,
        price,
        cost: cost || Math.round(price * 0.85),
        unit: newUnit,
        color: newColor,
        barcode: newBarcode || undefined,
      }),
    );
    setNewName("");
    setNewPrice("");
    setNewCost("");
    setNewBarcode("");
    setToast("পণ্য যোগ হয়েছে");
  }, [data, newName, newPrice, newCost, newUnit, newColor, newBarcode]);

  const handleRemoveProduct = useCallback(
    (id: string) => {
      if (!data) return;
      if (!confirm("এই পণ্য মুছবেন?")) return;
      setData(removeProduct(data, id));
      setToast("পণ্য মুছে ফেলা হয়েছে");
    },
    [data],
  );

  const tryOpenTab = useCallback(
    (next: Tab) => {
      if (next === "sell") {
        setTab("sell");
        return;
      }
      if (adminUnlocked) {
        setTab(next);
        return;
      }
      setLockTarget(next === "products" ? "products" : "report");
    },
    [adminUnlocked],
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
        <header className="sticky top-0 z-20 border-b border-emerald-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <input
              type="text"
              value={data.settings.shopName}
              onChange={(e) => setData(updateShopName(data, e.target.value))}
              className="max-w-xs border-none bg-transparent text-xl font-bold text-emerald-900 outline-none"
              aria-label="দোকানের নাম"
            />
            <nav className="flex gap-2">
              {(
                [
                  ["sell", "বিক্রি", false],
                  ["products", "পণ্য 🔒", true],
                  ["report", "হিসাব 🔒", true],
                ] as const
              ).map(([key, label, locked]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => tryOpenTab(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    tab === key
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  {locked && adminUnlocked ? label.replace(" 🔒", "") : label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4">
          {tab === "sell" && (
            <div className="grid gap-4 lg:grid-cols-[272px_1fr]">
              <aside className="sticky top-[4.5rem] z-10 h-fit space-y-3 self-start">
                <ProductCartPanel
                  cart={cart}
                  total={total}
                  onOpenCheckout={() => setCheckoutOpen(true)}
                  onRemoveLine={removeLine}
                />

                {lastSale && cart.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrintSale(lastSale);
                      setTimeout(() => window.print(), 100);
                    }}
                    className="w-full rounded-xl border border-emerald-300 bg-white py-2 text-sm font-semibold text-emerald-700"
                  >
                    ইনভয়েস প্রিন্ট #{lastSale.invoiceNo}
                  </button>
                )}

                <DigitalScale scale={scale} />

                <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
                  <label className="block text-sm font-semibold text-emerald-900">
                    বারকোড / কোড
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={barcodeRef}
                      type="text"
                      placeholder="স্ক্যান বা কোড"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addByBarcode(barcodeInput);
                          setBarcodeInput("");
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addByBarcode(barcodeInput);
                        setBarcodeInput("");
                      }}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </aside>

              <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <input
                  type="search"
                  placeholder="পণ্য খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-emerald-200 px-4 py-3 text-base outline-none focus:border-emerald-500"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const textColor = textOnColor(product.color);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        style={{
                          backgroundColor: product.color,
                          color: textColor,
                          borderColor: `${textColor}22`,
                        }}
                        className="flex min-h-[88px] flex-col items-start justify-between rounded-xl border-2 p-3 text-left shadow-sm transition hover:brightness-95 active:scale-[0.98]"
                      >
                        <span className="line-clamp-2 text-sm font-bold leading-snug">
                          {product.name}
                        </span>
                        <span className="mt-1 text-base font-bold">
                          {formatTaka(product.price)}/{product.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-slate-500">কোনো পণ্য পাওয়া যায়নি</p>
                )}
              </section>
            </div>
          )}

          {tab === "products" && adminUnlocked && (
            <section className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">নতুন পণ্য যোগ করুন</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="পণ্যের নাম"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="বিক্রয় দাম"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-3 py-3 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="ক্রয় দাম"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-3 py-3 outline-none"
                  />
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-3 py-3 outline-none"
                  >
                    {["পিস", "কেজি", "লিটার", "প্যাকেট", "হালি", "গ্রাম"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="বারকোড"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-9 w-9 rounded-full border-2 ${newColor === c ? "border-emerald-600" : "border-slate-200"}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
                >
                  যোগ করুন
                </button>
              </div>

              <h3 className="mb-2 mt-8 font-bold">সব পণ্য</h3>
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                {data.products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg border"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-slate-500">
                        বিক্রি {formatTaka(p.price)} · ক্রয় {formatTaka(p.cost)} / {p.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(p.id)}
                      className="text-sm text-red-600"
                    >
                      মুছুন
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "report" && adminUnlocked && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-medium">
                  তারিখ:
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-3 py-2 outline-none"
                  />
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      ["sales", "আজকের বিক্রি"],
                      ["products", "পণ্য"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReportTab(key)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        reportTab === key
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {reportTab === "sales" && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">মোট বিক্রি</p>
                    <p className="text-2xl font-bold">{formatTaka(dateTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">আজকের লাভ</p>
                    <p className="text-2xl font-bold text-blue-900">{formatTaka(dateProfit)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">বাকি সংগ্রহ (এই দিন)</p>
                    <p className="text-2xl font-bold text-amber-900">{formatTaka(dateCollections)}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-sm text-red-600">মোট বাকি</p>
                    <p className="text-2xl font-bold text-red-700">{formatTaka(dateDueTotal)}</p>
                  </div>
                </div>
              )}

              {reportTab === "sales" && collectionRows.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                  <h3 className="mb-2 font-bold text-amber-900">এই দিনে বাকি সংগ্রহ</h3>
                  <ul className="space-y-1 text-sm">
                    {collectionRows.map((row) => (
                      <li key={`${row.saleId}-${row.createdAt}`} className="flex justify-between">
                        <span>
                          #{row.invoiceNo}
                          {row.customerName ? ` · ${row.customerName}` : ""} ·{" "}
                          {formatTime(row.createdAt)}
                        </span>
                        <span className="font-bold">{formatTaka(row.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reportTab === "products" && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 font-bold">পণ্য অনুযায়ী বিক্রি</h3>
                  {productReport.length === 0 ? (
                    <p className="text-slate-500">এই তারিখে কোনো বিক্রি নেই</p>
                  ) : (
                    <ul className="space-y-2">
                      {productReport.map((row) => (
                        <li
                          key={row.productId}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-xs text-slate-500">
                              {row.qty > 0 && `${row.qty} ${row.unit}`}
                              {row.weight > 0 && `${row.weight.toFixed(3)} ${row.unit}`}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-700">
                            {formatTaka(row.revenue)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-bold">
                  {reportDate === todayKey() ? "আজকের" : formatDate(`${reportDate}T12:00:00`)} ইনভয়েস
                </h3>
                {dateSales.length === 0 ? (
                  <p className="text-slate-500">এই তারিখে কোনো বিক্রি নেই</p>
                ) : (
                  <ul className="space-y-2">
                    {[...dateSales].reverse().map((sale) => (
                      <li
                        key={sale.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailSale(sale)}
                        onKeyDown={(e) => e.key === "Enter" && setDetailSale(sale)}
                        className={`cursor-pointer rounded-xl border px-3 py-2 transition hover:bg-slate-50 ${
                          sale.due > 0 ? "border-red-200 bg-red-50/40" : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              #{sale.invoiceNo} · {formatTaka(sale.total)}
                              {sale.due > 0 && (
                                <span className="ml-2 text-sm text-red-600">
                                  বাকি {formatTaka(sale.due)}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTime(sale.createdAt)} · {sale.items.length}টি পণ্য
                            </p>
                          </div>
                          <span className="text-xs text-emerald-700">বিস্তারিত →</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </main>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-xl">
            {toast}
          </div>
        )}

        {lockTarget && data && (
          <PosLockModal
            data={data}
            tabLabel={lockTarget === "products" ? "পণ্য" : "হিসাব"}
            onUnlock={() => {
              setAdminUnlocked(true);
              setTab(lockTarget);
            }}
            onClose={() => setLockTarget(null)}
          />
        )}

        {checkoutOpen && (
          <CheckoutModal
            total={total}
            paidInput={paidInput}
            change={change}
            dueAmount={dueAmount}
            customerName={customerName}
            customerPhone={customerPhone}
            onPaidChange={setPaidInput}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onComplete={completeSale}
            onClose={() => setCheckoutOpen(false)}
            onClear={clearCart}
          />
        )}

        {detailSale && (
          <InvoiceDetailsModal
            sale={detailSale}
            shopName={data.settings.shopName}
            onClose={() => setDetailSale(null)}
            onPrint={() => {
              setPrintSale(detailSale);
              setTimeout(() => window.print(), 100);
            }}
            onCollect={detailSale.due > 0 ? handleCollectDue : undefined}
          />
        )}

        <div id="pos-receipt" className="hidden print:block">
          {printSale && (
            <ReceiptContent sale={printSale} shopName={data.settings.shopName} />
          )}
        </div>
      </div>
    </>
  );
}
