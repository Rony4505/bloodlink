"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DigitalScale, weightPricePreview } from "@/components/mudidokan/DigitalScale";
import { DueDetailsModal } from "@/components/mudidokan/DueDetailsModal";
import { InvoicePreviewModal } from "@/components/mudidokan/InvoicePreviewModal";
import { ReceiptContent } from "@/components/mudidokan/ReceiptContent";
import {
  cartTotal,
  formatDate,
  formatTaka,
  formatTime,
  lineTotal,
  textOnColor,
  todayKey,
} from "@/lib/mudidokan/format";
import { PRODUCT_COLOR_PRESETS } from "@/lib/mudidokan/seed";
import {
  addProduct,
  collectDue,
  findProductByBarcode,
  loadPosData,
  productReportForDate,
  recordSale,
  removeProduct,
  salesForDate,
  updateShopName,
} from "@/lib/mudidokan/storage";
import type { CartLine, PosData, Product, Sale } from "@/lib/mudidokan/types";
import { useWeightScale } from "@/lib/mudidokan/use-weight-scale";
import { formatWeightDisplay, isWeightUnit } from "@/lib/mudidokan/units";

type Tab = "sell" | "products" | "report";
type ReportTab = "sales" | "products";

function newLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function weightForProduct(scaleKg: number, unit: string): number {
  if (unit === "গ্রাম") return scaleKg * 1000;
  return scaleKg;
}

function buildDraftSale(
  cart: CartLine[],
  paid: number,
  customerName: string,
  customerPhone: string,
  invoiceNo: string,
): Sale {
  const total = cartTotal(cart);
  const due = Math.max(0, total - paid);
  return {
    id: "draft",
    invoiceNo,
    items: cart,
    total,
    paid,
    change: Math.max(0, paid - total),
    due,
    customerName: customerName.trim() || undefined,
    customerPhone: customerPhone.trim() || undefined,
    collections: [],
    createdAt: new Date().toISOString(),
  };
}

export function MudidokanPos() {
  const scale = useWeightScale();
  const [data, setData] = useState<PosData | null>(null);
  const [tab, setTab] = useState<Tab>("sell");
  const [reportTab, setReportTab] = useState<ReportTab>("sales");
  const [reportDate, setReportDate] = useState(todayKey());
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [paidInput, setPaidInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [dueSale, setDueSale] = useState<Sale | null>(null);
  const [toast, setToast] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
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
  const productReport = useMemo(
    () => (data ? productReportForDate(data, reportDate) : []),
    [data, reportDate],
  );

  const todaySales = useMemo(
    () => (data ? salesForDate(data, todayKey()) : []),
    [data],
  );
  const todayTotal = useMemo(
    () => todaySales.reduce((s, sale) => s + sale.total, 0),
    [todaySales],
  );

  const addToCart = useCallback(
    (product: Product) => {
      if (isWeightUnit(product.unit)) {
        const w = weightForProduct(scale.weightKg, product.unit);
        if (w <= 0) {
          setToast("স্কেলে ওজন দিন");
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
    },
    [scale.weightKg],
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

  const updateQty = useCallback((lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0 || l.weight != null),
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPaidInput("");
    setCustomerName("");
    setCustomerPhone("");
  }, []);

  const openPreview = useCallback(() => {
    if (!data || cart.length === 0) return;
    const draft = buildDraftSale(
      cart,
      paid,
      customerName,
      customerPhone,
      String(data.invoiceCounter + 1).padStart(4, "0"),
    );
    setPreviewSale(draft);
  }, [data, cart, paid, customerName, customerPhone]);

  const confirmPrint = useCallback(() => {
    if (!data || !previewSale) return;
    const { data: next, sale } = recordSale(data, {
      items: previewSale.items,
      paid: previewSale.paid,
      customerName: previewSale.customerName,
      customerPhone: previewSale.customerPhone,
    });
    setData(next);
    setPrintSale(sale);
    setPreviewSale(null);
    clearCart();
    setToast("বিক্রি সম্পন্ন!");
    setTimeout(() => window.print(), 200);
  }, [data, previewSale, clearCart]);

  const handleCollectDue = useCallback(
    (amount: number, note?: string) => {
      if (!data || !dueSale) return;
      const result = collectDue(data, dueSale.id, amount, note);
      if (!result) {
        setToast("সংগ্রহ হয়নি");
        return;
      }
      setData(result.data);
      setDueSale(result.sale);
      setToast("বাকি সংগ্রহ হয়েছে");
      if (result.sale.due <= 0) {
        setTimeout(() => setDueSale(null), 800);
      }
    },
    [data, dueSale],
  );

  const handleAddProduct = useCallback(() => {
    if (!data) return;
    const price = Number(newPrice);
    if (!newName.trim() || !price || price <= 0) {
      setToast("নাম ও দাম দিন");
      return;
    }
    setData(
      addProduct(data, {
        name: newName,
        price,
        unit: newUnit,
        color: newColor,
        barcode: newBarcode || undefined,
      }),
    );
    setNewName("");
    setNewPrice("");
    setNewBarcode("");
    setToast("পণ্য যোগ হয়েছে");
  }, [data, newName, newPrice, newUnit, newColor, newBarcode]);

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
        <header className="sticky top-0 z-20 border-b border-emerald-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
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

        <main className="mx-auto max-w-7xl px-4 py-4">
          {tab === "sell" && (
            <div className="grid gap-4 xl:grid-cols-[240px_1fr_340px]">
              <aside className="space-y-4">
                <DigitalScale scale={scale} />
                <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
                  <label className="block text-sm font-semibold text-emerald-900">
                    বারকোড / কোড
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={barcodeRef}
                      type="text"
                      placeholder="স্ক্যান বা কোড লিখুন"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addByBarcode(barcodeInput);
                          setBarcodeInput("");
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
                  <p className="mt-2 text-xs text-slate-500">
                    স্ক্যানার দিয়ে স্ক্যান করুন অথবা কোড লিখে Enter
                  </p>
                </div>
              </aside>

              <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <input
                  type="search"
                  placeholder="পণ্য খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-emerald-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const isWeight = isWeightUnit(product.unit);
                    const livePrice =
                      isWeight && scale.weightKg > 0
                        ? weightPricePreview(product.price, scale.weightKg, product.unit)
                        : null;
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
                        className="flex min-h-[96px] flex-col items-start justify-between rounded-xl border-2 p-3 text-left shadow-sm transition hover:brightness-95 active:scale-[0.98]"
                      >
                        <span className="line-clamp-2 text-sm font-bold leading-snug">
                          {product.name}
                        </span>
                        <div className="mt-1 w-full">
                          <span className="text-base font-bold">
                            {formatTaka(product.price)}/{product.unit}
                          </span>
                          {livePrice && (
                            <p className="mt-0.5 text-xs font-semibold opacity-90">
                              ওজন: {scale.weightKg.toFixed(3)} kg = {livePrice}
                            </p>
                          )}
                          {product.barcode && (
                            <p className="text-[10px] opacity-70">#{product.barcode}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-slate-500">কোনো পণ্য পাওয়া যায়নি</p>
                )}
              </section>

              <aside className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)]">
                <h2 className="mb-3 text-lg font-bold text-emerald-900">বিল</h2>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">পণ্যে ক্লিক করুন</p>
                  ) : (
                    cart.map((line) => (
                      <div
                        key={line.lineId}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line.name}</p>
                          <p className="text-xs text-slate-500">
                            {line.weight != null
                              ? `${formatTaka(line.price)}/${line.unit} · ${formatWeightDisplay(line.weight, line.unit)}`
                              : `${formatTaka(line.price)} × ${line.qty}`}
                          </p>
                        </div>
                        {line.weight == null ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQty(line.lineId, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold shadow-sm"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(line.lineId, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                            className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            মুছুন
                          </button>
                        )}
                        <span className="w-16 text-right text-sm font-bold">
                          {formatTaka(lineTotal(line))}
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

                  {paidInput && change > 0 && (
                    <div className="flex justify-between rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-900">
                      <span>ফেরত</span>
                      <span>{formatTaka(change)}</span>
                    </div>
                  )}

                  {dueAmount > 0 && (
                    <>
                      <div className="flex justify-between rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
                        <span>বাকি</span>
                        <span>{formatTaka(dueAmount)}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="গ্রাহকের নাম (বাকির জন্য)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="মোবাইল (ঐচ্ছিক)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                      />
                    </>
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
                      onClick={openPreview}
                      disabled={cart.length === 0}
                      className="rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-40"
                    >
                      ইনভয়েস দেখুন
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
                  placeholder="পণ্যের নাম"
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
                    className="rounded-xl border border-emerald-200 px-4 py-3 outline-none"
                  >
                    {["পিস", "কেজি", "লিটার", "প্যাকেট", "হালি", "গ্রাম"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="বারকোড (ঐচ্ছিক)"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none"
                />
                <div>
                  <p className="mb-2 text-sm font-medium">রঙ</p>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-9 w-9 rounded-full border-2 ${newColor === c ? "border-emerald-600 ring-2 ring-emerald-300" : "border-slate-200"}`}
                        aria-label={c}
                      />
                    ))}
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200"
                    />
                  </div>
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
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg border border-slate-200"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatTaka(p.price)} / {p.unit}
                        {p.barcode ? ` · #${p.barcode}` : ""}
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">মোট বিক্রি</p>
                    <p className="text-2xl font-bold text-emerald-900">{formatTaka(dateTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">বিল সংখ্যা</p>
                    <p className="text-2xl font-bold text-emerald-900">{dateSales.length}টি</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-sm text-red-600">মোট বাকি</p>
                    <p className="text-2xl font-bold text-red-700">{formatTaka(dateDueTotal)}</p>
                  </div>
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
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition hover:bg-slate-50 ${
                          sale.due > 0 ? "border-red-200 bg-red-50/50" : "border-slate-100"
                        }`}
                        onClick={() => {
                          if (sale.due > 0) setDueSale(sale);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && sale.due > 0) setDueSale(sale);
                        }}
                        role={sale.due > 0 ? "button" : undefined}
                        tabIndex={sale.due > 0 ? 0 : undefined}
                      >
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
                            {sale.customerName ? ` · ${sale.customerName}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {sale.due > 0 && (
                            <span className="text-xs font-medium text-red-600">বাকি দেখুন</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintSale(sale);
                              setTimeout(() => window.print(), 100);
                            }}
                            className="text-sm font-medium text-emerald-700 hover:underline"
                          >
                            রসিদ
                          </button>
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

        {previewSale && (
          <InvoicePreviewModal
            sale={previewSale}
            shopName={data.settings.shopName}
            onClose={() => setPreviewSale(null)}
            onPrint={confirmPrint}
          />
        )}

        {dueSale && (
          <DueDetailsModal
            sale={dueSale}
            onClose={() => setDueSale(null)}
            onCollect={handleCollectDue}
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
