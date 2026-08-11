"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type {
  AdminNotification,
  AnalyticsSummary,
  Category,
  Coupon,
  DeliveryRule,
  FashionOrder,
  OrderStatus,
  Product,
  ProductInput,
  StoreSettings,
} from "@/lib/fashion/types";

type Tab = "products" | "orders" | "categories" | "delivery" | "coupons" | "settings" | "analytics" | "reports";

const emptyProduct: ProductInput = {
  name: "",
  nameBn: "",
  price: 0,
  buyPrice: 0,
  categorySlug: "festive",
  description: "",
  descriptionBn: "",
  fabric: "",
  sizes: ["S", "M", "L"],
  colors: [{ name: "Default", hex: "#f8efe9" }],
  tone: "bg-[#f8efe9]",
  imageUrl: "https://images.unsplash.com/photo-1595777457582-31a4f8e1a5c5?auto=format&fit=crop&w=900&q=80",
  stock: 25,
  inStock: true,
  featured: false,
  pricingMode: "markup",
};

const statusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function FashionAdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [analytics, setAnalytics] = useState<{ daily: AnalyticsSummary; monthly: AnalyticsSummary } | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await Promise.all([
      fetch("/api/fashion/products"),
      fetch("/api/fashion/orders"),
      fetch("/api/fashion/categories"),
      fetch("/api/fashion/coupons"),
      fetch("/api/fashion/settings"),
      fetch("/api/fashion/analytics?period=daily"),
      fetch("/api/fashion/analytics?period=monthly"),
      fetch("/api/fashion/notifications?scope=admin"),
    ]);

    if (res[0].status === 401) {
      router.push("/store-admin/login");
      return;
    }

    const [p, o, c, cp, s, d, m, n] = await Promise.all(res.map((r) => r.json()));
    setProducts(p.products ?? []);
    setOrders(o.orders ?? []);
    setCategories(c.categories ?? []);
    setCoupons(cp.coupons ?? []);
    setSettings(s.settings ?? null);
    setAnalytics({ daily: d.analytics, monthly: m.analytics });
    setAdminNotifications(n.notifications ?? []);
  }

  useEffect(() => {
    void load();
  }, [router]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyProduct);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({ ...product, featured: product.featured ?? false });
    setModalOpen(true);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/fashion/products/${editingId}` : "/api/fashion/products";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setMessage("সেভ করা যায়নি");
      return;
    }
    setModalOpen(false);
    setMessage("প্রোডাক্ট সেভ হয়েছে");
    await load();
  }

  async function removeProduct(id: string) {
    await fetch(`/api/fashion/products/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/fashion/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setForm((c) => ({ ...c, imageUrl: data.url }));
  }

  async function saveCategories() {
    await fetch("/api/fashion/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    setMessage("ক্যাটাগরি আপডেট হয়েছে");
  }

  async function saveSettings() {
    if (!settings) return;
    await fetch("/api/fashion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage("সেটিংস সেভ হয়েছে");
  }

  async function saveDeliveryRules(rules: DeliveryRule[]) {
    if (!settings) return;
    const next = { ...settings, deliveryRules: rules };
    setSettings(next);
    await fetch("/api/fashion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setMessage("ডেলিভারি নিয়ম সেভ হয়েছে");
  }

  async function saveCoupon(coupon: Coupon) {
    await fetch("/api/fashion/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    await load();
  }

  async function updateOrder(orderId: string, status: OrderStatus, msg: string) {
    await fetch(`/api/fashion/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message: msg }),
    });
    setMessage("অর্ডার আপডেট হয়েছে");
    await load();
  }

  async function logout() {
    await fetch("/api/fashion/admin", { method: "DELETE" });
    router.push("/store-admin/login");
  }

  function printReport() {
    window.print();
  }

  const unreadCount = adminNotifications.filter((n) => !n.read).length;
  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: copy.admin.products },
    { id: "orders", label: `${copy.admin.orders}${unreadCount ? ` (${unreadCount})` : ""}` },
    { id: "categories", label: copy.admin.categories },
    { id: "delivery", label: copy.admin.delivery },
    { id: "coupons", label: copy.admin.coupons },
    { id: "settings", label: copy.admin.settings },
    { id: "analytics", label: copy.admin.analytics },
    { id: "reports", label: copy.admin.reports },
  ];

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20 print:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">{copy.admin.title}</h1>
            {unreadCount > 0 ? (
              <p className="mt-2 text-sm text-[#8f624e]">{unreadCount} নতুন অর্ডার নোটিফিকেশন</p>
            ) : null}
          </div>
          <FashionButton variant="secondary" onClick={logout}>{copy.nav.logout}</FashionButton>
        </div>

        {message ? <p className="mt-4 text-sm text-[#8b6456] print:hidden">{message}</p> : null}

        <div className="mt-8 flex flex-wrap gap-2 print:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-[linear-gradient(135deg,#2b1d19,#6b4a3d)] text-[#f4d4c2] shadow-md"
                  : "border border-black/8 bg-white text-[#5b4339] hover:bg-[#faf4f0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="mt-8 print:hidden">
            <div className="flex justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.admin.products}</h2>
              <FashionButton onClick={openCreate}>{copy.actions.create}</FashionButton>
            </div>
            <div className="mt-4 space-y-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-[1.5rem] border border-black/6 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.nameBn}</p>
                      <p className="text-sm text-[#8b6456]">
                        {formatBdt(product.price)} · স্টক: {product.stock}
                        {product.offerActive ? ` · ${product.offerDiscountPercent}% অফার` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm font-semibold" onClick={() => openEdit(product)}>{copy.actions.edit}</button>
                      <button className="text-sm font-semibold text-red-700" onClick={() => removeProduct(product.id)}>{copy.actions.delete}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8 space-y-4 print:hidden">
            {adminNotifications.filter((n) => !n.read).map((n) => (
              <div key={n.id} className="rounded-2xl border border-[#d4b896]/40 bg-[#faf0ea] px-4 py-3 text-sm">
                🔔 {n.title}: {n.body}
              </div>
            ))}
            {orders.map((order) => (
              <article key={order.id} className="rounded-[1.5rem] border border-black/6 bg-[#faf4f0] p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="font-semibold">{order.id} · {order.customerName}</p>
                  <p>{formatBdt(order.total)} · {copy.orderStatus[order.status]}</p>
                </div>
                <p className="mt-2 text-sm text-[#6f554a]">{order.phone} · {order.district}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateOrder(order.id, st, `অর্ডার ${copy.orderStatus[st]} হয়েছে`)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === st ? "bg-[#2b1d19] text-white" : "bg-white border border-black/8"
                      }`}
                    >
                      {copy.orderStatus[st]}
                    </button>
                  ))}
                </div>
                {order.statusHistory?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-[#8b6456]">
                    {order.statusHistory.map((h, i) => (
                      <li key={i}>{new Date(h.updatedAt).toLocaleString("bn-BD")} — {h.message}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}

        {tab === "categories" && (
          <div className="mt-8 space-y-4 print:hidden">
            {categories.map((cat, i) => (
              <div key={cat.slug} className="grid gap-3 rounded-2xl border border-black/6 bg-white p-4 md:grid-cols-2">
                <input className="field" value={cat.titleBn} onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...cat, titleBn: e.target.value };
                  setCategories(next);
                }} placeholder="বাংলা নাম" />
                <input className="field" value={cat.slug} onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...cat, slug: e.target.value };
                  setCategories(next);
                }} placeholder="slug" />
                <input className="field md:col-span-2" value={cat.subtitle} onChange={(e) => {
                  const next = [...categories];
                  next[i] = { ...cat, subtitle: e.target.value };
                  setCategories(next);
                }} placeholder="সাবটাইটেল" />
              </div>
            ))}
            <FashionButton onClick={saveCategories}>{copy.actions.save}</FashionButton>
          </div>
        )}

        {tab === "delivery" && settings && (
          <div className="mt-8 space-y-4 print:hidden">
            {settings.deliveryRules.map((rule, i) => (
              <div key={rule.id} className="grid gap-3 rounded-2xl border border-black/6 bg-white p-4 md:grid-cols-4">
                <input className="field" value={rule.district} onChange={(e) => {
                  const rules = [...settings.deliveryRules];
                  rules[i] = { ...rule, district: e.target.value };
                  setSettings({ ...settings, deliveryRules: rules });
                }} placeholder="জেলা (* = সব)" />
                <input className="field" type="number" value={rule.fee} onChange={(e) => {
                  const rules = [...settings.deliveryRules];
                  rules[i] = { ...rule, fee: Number(e.target.value) };
                  setSettings({ ...settings, deliveryRules: rules });
                }} placeholder="ফি" />
                <input className="field" type="number" value={rule.minOrderForFree ?? ""} onChange={(e) => {
                  const rules = [...settings.deliveryRules];
                  rules[i] = { ...rule, minOrderForFree: Number(e.target.value) || undefined };
                  setSettings({ ...settings, deliveryRules: rules });
                }} placeholder="ফ্রি মিন. অর্ডার" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={rule.active} onChange={(e) => {
                    const rules = [...settings.deliveryRules];
                    rules[i] = { ...rule, active: e.target.checked };
                    setSettings({ ...settings, deliveryRules: rules });
                  }} />
                  সক্রিয়
                </label>
              </div>
            ))}
            <FashionButton onClick={() => saveDeliveryRules(settings.deliveryRules)}>{copy.actions.save}</FashionButton>
          </div>
        )}

        {tab === "coupons" && (
          <div className="mt-8 space-y-4 print:hidden">
            <FashionButton onClick={() => saveCoupon({
              id: `cp${Date.now()}`,
              code: "SLOWGUN10",
              discountType: "percent",
              discountValue: 10,
              active: true,
            })}>নতুন কুপন (SLOWGUN10)</FashionButton>
            {coupons.map((coupon) => (
              <article key={coupon.id} className="rounded-2xl border border-black/6 bg-white p-4">
                <p className="font-semibold">{coupon.code} · {coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatBdt(coupon.discountValue)}</p>
                <p className="text-sm text-[#8b6456]">{coupon.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "settings" && settings && (
          <div className="mt-8 space-y-4 rounded-2xl border border-black/6 bg-white p-6 print:hidden">
            <label className="block">
              <span className="text-sm text-[#9b7766]">ব্র্যান্ড নাম</span>
              <input className="field mt-1" value={settings.brandName} onChange={(e) => setSettings({ ...settings, brandName: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm text-[#9b7766]">ডিফল্ট মার্কআপ %</span>
              <input className="field mt-1" type="number" value={settings.defaultMarkupPercent} onChange={(e) => setSettings({ ...settings, defaultMarkupPercent: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-sm text-[#9b7766]">প্রাইসিং মোড</span>
              <select className="field mt-1" value={settings.pricingMode} onChange={(e) => setSettings({ ...settings, pricingMode: e.target.value as "markup" | "manual" })}>
                <option value="markup">কেনা দাম + % মার্কআপ</option>
                <option value="manual">ম্যানুয়াল সেল প্রাইস</option>
              </select>
            </label>
            <FashionButton onClick={saveSettings}>{copy.actions.save}</FashionButton>
          </div>
        )}

        {tab === "analytics" && analytics && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 print:hidden">
            {(["daily", "monthly"] as const).map((period) => {
              const a = analytics[period];
              return (
                <div key={period} className="rounded-[2rem] border border-black/6 bg-white p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                    {period === "daily" ? "আজকের হিসাব" : "মাসিক হিসাব"}
                  </h3>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between"><dt>বিক্রয়</dt><dd>{formatBdt(a.revenue)}</dd></div>
                    <div className="flex justify-between"><dt>খরচ</dt><dd>{formatBdt(a.cost)}</dd></div>
                    <div className="flex justify-between"><dt>লাভ</dt><dd>{formatBdt(a.profit)}</dd></div>
                    <div className="flex justify-between"><dt>ডেলিভারি ফি</dt><dd>{formatBdt(a.deliveryFees)}</dd></div>
                    <div className="flex justify-between"><dt>অর্ডার</dt><dd>{a.orderCount}</dd></div>
                    <div className="flex justify-between"><dt>বাতিল</dt><dd>{a.cancelledCount}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
        )}

        {tab === "reports" && (
          <div className="mt-8 print:hidden">
            <FashionButton onClick={printReport}>{copy.actions.print}</FashionButton>
          </div>
        )}

        <div ref={reportRef} className={`mt-8 ${tab === "reports" ? "" : "hidden print:block"}`}>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">Slowgun Order Report</h2>
          <p className="text-sm text-[#8b6456]">{new Date().toLocaleString("bn-BD")}</p>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">ID</th>
                <th className="py-2 text-left">Customer</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-black/5">
                  <td className="py-2">{o.id}</td>
                  <td className="py-2">{o.customerName}</td>
                  <td className="py-2">{copy.orderStatus[o.status]}</td>
                  <td className="py-2 text-right">{formatBdt(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm print:hidden">
          <form onSubmit={saveProduct} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-black/8 bg-white p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {editingId ? copy.actions.edit : copy.actions.create}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-sm font-semibold">{copy.actions.close}</button>
            </div>
            {[
              ["nameBn", "নাম (বাংলা)"],
              ["name", "নাম (English)"],
              ["buyPrice", "কেনা দাম"],
              ["price", "বিক্রয় দাম (manual mode)"],
              ["stock", "স্টক"],
              ["categorySlug", "ক্যাটাগরি slug"],
              ["fabric", "ফ্যাব্রিক"],
              ["imageUrl", "ইমেজ URL"],
              ["descriptionBn", "বর্ণনা (বাংলা)"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm text-[#9b7766]">{label}</span>
                <input
                  className="field mt-1"
                  value={String(form[key as keyof ProductInput] ?? "")}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      [key]: ["price", "buyPrice", "stock", "markupPercent", "offerDiscountPercent"].includes(key)
                        ? Number(e.target.value)
                        : e.target.value,
                    }))
                  }
                  required={["nameBn", "name", "categorySlug"].includes(key)}
                />
              </label>
            ))}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }} />
              <FashionButton type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "আপলোড..." : copy.actions.upload}
              </FashionButton>
            </div>
            <label className="block">
              <span className="text-sm text-[#9b7766]">প্রাইসিং মোড</span>
              <select className="field mt-1" value={form.pricingMode ?? "markup"} onChange={(e) => setForm((c) => ({ ...c, pricingMode: e.target.value as "markup" | "manual" }))}>
                <option value="markup">মার্কআপ</option>
                <option value="manual">ম্যানুয়াল</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.offerActive} onChange={(e) => setForm((c) => ({ ...c, offerActive: e.target.checked }))} />
              অফার চালু
            </label>
            {form.offerActive ? (
              <>
                <input className="field" placeholder="অফার লেবেল" value={form.offerLabel ?? ""} onChange={(e) => setForm((c) => ({ ...c, offerLabel: e.target.value }))} />
                <input className="field" type="number" placeholder="ছাড় %" value={form.offerDiscountPercent ?? ""} onChange={(e) => setForm((c) => ({ ...c, offerDiscountPercent: Number(e.target.value) }))} />
              </>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((c) => ({ ...c, featured: e.target.checked }))} />
              Featured
            </label>
            <FashionButton type="submit">{copy.actions.save}</FashionButton>
          </form>
        </div>
      ) : null}
    </FashionShell>
  );
}

export function FashionAdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/fashion/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("পাসওয়ার্ড সঠিক নয়");
      return;
    }
    router.push("/store-admin");
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{copy.admin.loginTitle}</h1>
        <p className="mt-2 text-sm text-[#8b6456]">Slowgun Admin</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required />
          <FashionButton type="submit">Login</FashionButton>
        </form>
      </section>
    </FashionShell>
  );
}
