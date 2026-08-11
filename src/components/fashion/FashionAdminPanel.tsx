"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FashionButton } from "@/components/fashion/FashionButton";
import {
  AdminConfirmModal,
  AdminModal,
  AdminShell,
  AdminSuccessModal,
} from "@/components/fashion/admin/AdminShell";
import { adminThemes, type AdminTheme } from "@/components/fashion/admin/admin-themes";
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
  PromoBanner,
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

const emptyCoupon: Coupon = {
  id: "",
  code: "",
  discountType: "percent",
  discountValue: 10,
  active: true,
};

const statusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const menuItems: { id: Tab; label: string; theme: AdminTheme; hint: string }[] = [
  { id: "products", label: copy.admin.products, theme: "rose", hint: "সার্চ ও এডিট" },
  { id: "orders", label: copy.admin.orders, theme: "ocean", hint: "ট্র্যাকিং" },
  { id: "categories", label: copy.admin.categories, theme: "sage", hint: "কালেকশন" },
  { id: "delivery", label: copy.admin.delivery, theme: "sunset", hint: "ডেলিভারি ফি" },
  { id: "coupons", label: copy.admin.coupons, theme: "violet", hint: "কুপন কোড" },
  { id: "settings", label: copy.admin.settings, theme: "gold", hint: "ওয়েবসাইট" },
  { id: "analytics", label: copy.admin.analytics, theme: "slate", hint: "হিসাব" },
  { id: "reports", label: copy.admin.reports, theme: "pearl", hint: "প্রিন্ট" },
];

export function FashionAdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [analytics, setAnalytics] = useState<{ daily: AnalyticsSummary; monthly: AnalyticsSummary } | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>(emptyCoupon);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string; theme: AdminTheme } | null>(null);
  const [uploadBannerId, setUploadBannerId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

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

  function showSuccess(title: string, message: string, theme: AdminTheme) {
    setSuccess({ title, message, theme });
  }

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return false;
    return [p.name, p.nameBn, p.id, p.slug, p.categorySlug].join(" ").toLowerCase().includes(q);
  });

  function openProductEdit(product: Product) {
    setEditingId(product.id);
    setForm({ ...product, featured: product.featured ?? false });
    setProductModalOpen(true);
  }

  function openProductCreate() {
    setEditingId(null);
    setForm(emptyProduct);
    setProductModalOpen(true);
  }

  function handleProductSearchSubmit(event: FormEvent) {
    event.preventDefault();
    if (filteredProducts.length === 1) openProductEdit(filteredProducts[0]);
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
    if (!res.ok) return;
    setProductModalOpen(false);
    showSuccess("সফল!", "প্রোডাক্ট সংরক্ষণ হয়েছে", "rose");
    await load();
  }

  async function handleUpload(file: File, target: "product" | "banner", bannerId?: string) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/fashion/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!data.url) return;
    if (target === "product") setForm((c) => ({ ...c, imageUrl: data.url }));
    else if (target === "banner" && settings && bannerId) {
      const banners = (settings.promoBanners ?? []).map((b) =>
        b.id === bannerId ? { ...b, imageUrl: data.url } : b,
      );
      setSettings({ ...settings, promoBanners: banners });
    }
  }

  async function saveCategories() {
    await fetch("/api/fashion/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories }),
    });
    showSuccess("সফল!", "ক্যাটাগরি আপডেট হয়েছে", "sage");
    await load();
  }

  async function saveSettings() {
    if (!settings) return;
    await fetch("/api/fashion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    showSuccess("সফল!", "ওয়েবসাইট সেটিংস সেভ হয়েছে — কোনো ডেটা মুছে যায়নি", "gold");
    await load();
  }

  async function saveDelivery() {
    if (!settings) return;
    await fetch("/api/fashion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryRules: settings.deliveryRules }),
    });
    showSuccess("সফল!", "ডেলিভারি নিয়ম সেভ হয়েছে", "sunset");
    await load();
  }

  async function saveCoupon(event: FormEvent) {
    event.preventDefault();
    const coupon = { ...couponForm, id: couponForm.id || `cp${Date.now()}` };
    await fetch("/api/fashion/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    setCouponForm(emptyCoupon);
    showSuccess("সফল!", `কুপন ${coupon.code} সেভ হয়েছে`, "violet");
    await load();
  }

  async function removeCoupon(id: string) {
    await fetch(`/api/fashion/coupons?id=${id}`, { method: "DELETE" });
    showSuccess("মুছে ফেলা হয়েছে", "কুপন সরানো হয়েছে", "violet");
    await load();
  }

  async function confirmOrderStatus() {
    if (!pendingStatus) return;
    const { orderId, status } = pendingStatus;
    await fetch(`/api/fashion/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message: `অর্ডার ${copy.orderStatus[status]} হয়েছে` }),
    });
    setPendingStatus(null);
    showSuccess("অর্ডার আপডেট!", `${copy.orderStatus[status]} স্ট্যাটাস সেট হয়েছে`, "ocean");
    await load();
  }

  async function logout() {
    await fetch("/api/fashion/admin", { method: "DELETE" });
    router.push("/store-admin/login");
  }

  function addDeliveryRule() {
    if (!settings) return;
    setSettings({
      ...settings,
      deliveryRules: [
        ...settings.deliveryRules,
        { id: `d${Date.now()}`, district: "Dhaka", fee: 100, minOrderForFree: 5000, active: true },
      ],
    });
  }

  function addBanner() {
    if (!settings) return;
    const banner: PromoBanner = {
      id: `bn${Date.now()}`,
      imageUrl: "",
      title: "নতুন অফার",
      linkSlug: "",
      active: true,
      sortOrder: (settings.promoBanners?.length ?? 0) + 1,
    };
    setSettings({ ...settings, promoBanners: [...(settings.promoBanners ?? []), banner] });
  }

  const unreadCount = adminNotifications.filter((n) => !n.read).length;
  const activeTheme = menuItems.find((m) => m.id === activeTab)?.theme ?? "rose";

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9b7766]">Slowgun</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">{copy.admin.title}</h1>
          {unreadCount > 0 ? (
            <p className="mt-2 text-sm text-[#b86a2e]">{unreadCount} নতুন অর্ডার</p>
          ) : null}
        </div>
        <FashionButton variant="secondary" onClick={logout}>{copy.nav.logout}</FashionButton>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {menuItems.map((item) => {
          const t = adminThemes[item.theme];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`rounded-[1.75rem] border p-5 text-left shadow-[0_16px_50px_rgba(43,29,25,0.08)] transition hover:-translate-y-1 ${t.gradient} ${t.border}`}
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold">{item.label}</p>
              <p className="mt-1 text-sm text-[#7a5c50]">{item.hint}</p>
              {item.id === "orders" && unreadCount > 0 ? (
                <span className="mt-2 inline-block rounded-full bg-[#e8a598] px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Products Modal */}
      <AdminModal
        open={activeTab === "products"}
        onClose={() => setActiveTab(null)}
        title={copy.admin.products}
        subtitle="প্রোডাক্ট সার্চ করুন — ফলাফলে ক্লিক করলে এডিট popup আসবে"
        theme="rose"
        wide
      >
        <form onSubmit={handleProductSearchSubmit} className="flex gap-2">
          <input
            className="field flex-1"
            placeholder="নাম, ID, slug লিখুন..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            autoFocus
          />
          <FashionButton type="submit">খুঁজুন</FashionButton>
        </form>
        <div className="mt-4 flex justify-end">
          <FashionButton onClick={openProductCreate}>{copy.actions.create}</FashionButton>
        </div>
        {productSearch.trim() ? (
          <div className="mt-4 space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-[#8b6456]">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProductEdit(p)}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/6 bg-white/80 px-4 py-3 text-left transition hover:bg-white"
                >
                  <span className="font-semibold">{p.nameBn}</span>
                  <span className="text-sm text-[#8b6456]">{formatBdt(p.price)} · স্টক {p.stock}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#8b6456]">সার্চ বক্সে লিখে প্রোডাক্ট খুঁজুন</p>
        )}
      </AdminModal>

      {/* Orders Modal */}
      <AdminModal
        open={activeTab === "orders"}
        onClose={() => setActiveTab(null)}
        title={copy.admin.orders}
        subtitle="স্ট্যাটাস বেছে নিলে নিশ্চিত করার popup আসবে"
        theme="ocean"
        wide
      >
        {adminNotifications.filter((n) => !n.read).map((n) => (
          <div key={n.id} className="mb-3 rounded-2xl border border-[#a8c8ef]/40 bg-white/70 px-4 py-3 text-sm">
            🔔 {n.title}: {n.body}
          </div>
        ))}
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-black/6 bg-white/80 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold">{order.id} · {order.customerName}</p>
                <p className="text-[#3d6a9e]">{formatBdt(order.total)}</p>
              </div>
              <p className="mt-1 text-sm text-[#6f554a]">
                বর্তমান: <strong>{copy.orderStatus[order.status]}</strong>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPendingStatus({ orderId: order.id, status: st })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      order.status === st
                        ? "bg-[linear-gradient(135deg,#a8c8ef,#dcecff)] text-[#3d6a9e] ring-2 ring-[#a8c8ef]"
                        : "border border-black/8 bg-white text-[#5b4339] hover:bg-[#eef6ff]"
                    }`}
                  >
                    {copy.orderStatus[st]}
                  </button>
                ))}
              </div>
              {order.statusHistory?.length ? (
                <ul className="mt-3 space-y-1 border-t border-black/5 pt-3 text-xs text-[#8b6456]">
                  {order.statusHistory.map((h, i) => (
                    <li key={i}>{new Date(h.updatedAt).toLocaleString("bn-BD")} — {h.message}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </AdminModal>

      {/* Categories Modal */}
      <AdminModal open={activeTab === "categories"} onClose={() => setActiveTab(null)} title={copy.admin.categories} theme="sage" wide>
        <p className="mb-4 text-sm text-[#6f554a]">ক্যাটাগরি এডিট করলে পুরনো ডেটা মুছে যাবে না — শুধু আপডেট হবে।</p>
        {categories.map((cat, i) => (
          <div key={cat.slug} className="mb-3 grid gap-2 rounded-2xl border border-black/6 bg-white/80 p-4 md:grid-cols-2">
            <input className="field" value={cat.titleBn} onChange={(e) => {
              const next = [...categories]; next[i] = { ...cat, titleBn: e.target.value }; setCategories(next);
            }} placeholder="বাংলা নাম" />
            <input className="field" value={cat.slug} onChange={(e) => {
              const next = [...categories]; next[i] = { ...cat, slug: e.target.value }; setCategories(next);
            }} placeholder="slug" />
            <input className="field md:col-span-2" value={cat.subtitle} onChange={(e) => {
              const next = [...categories]; next[i] = { ...cat, subtitle: e.target.value }; setCategories(next);
            }} placeholder="সাবটাইটেল" />
          </div>
        ))}
        <FashionButton onClick={saveCategories}>{copy.actions.save}</FashionButton>
      </AdminModal>

      {/* Delivery Modal */}
      <AdminModal
        open={activeTab === "delivery"}
        onClose={() => setActiveTab(null)}
        title={copy.admin.delivery}
        subtitle="কোন জেলায় কত টাকা ডেলিভারি ফি — সহজ ভাষায়"
        theme="sunset"
        wide
      >
        <div className="mb-5 rounded-2xl border border-[#f0c49a]/50 bg-white/70 p-4 text-sm leading-7 text-[#6f554a]">
          <p><strong>কীভাবে কাজ করে:</strong></p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>জেলা</strong> — গ্রাহকের জেলার নাম (যেমন Dhaka)। <code>*</code> মানে বাকি সব জেলা।</li>
            <li><strong>ডেলিভারি ফি</strong> — ওই জেলায় কত টাকা নেবেন।</li>
            <li><strong>ফ্রি মিন. অর্ডার</strong> — এত টাকার উপরে অর্ডার হলে ডেলিভারি ফ্রি (০ টাকা)।</li>
          </ul>
          <p className="mt-3 rounded-xl bg-[#fff8f0] px-3 py-2">
            উদাহরণ: Dhaka, ফি ৮০, ফ্রি মিন. ৭০০০ → ৭০০০+ অর্ডারে ঢাকায় ফ্রি, নাহলে ৮০ টাকা।
          </p>
        </div>
        {settings?.deliveryRules.map((rule, i) => (
          <div key={rule.id} className="mb-3 grid gap-2 rounded-2xl border border-black/6 bg-white/80 p-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs text-[#9b7766]">জেলা</span>
              <input className="field mt-1" value={rule.district} onChange={(e) => {
                const rules = [...settings.deliveryRules];
                rules[i] = { ...rule, district: e.target.value };
                setSettings({ ...settings, deliveryRules: rules });
              }} />
            </label>
            <label className="block">
              <span className="text-xs text-[#9b7766]">ডেলিভারি ফি (৳)</span>
              <input className="field mt-1" type="number" value={rule.fee} onChange={(e) => {
                const rules = [...settings.deliveryRules];
                rules[i] = { ...rule, fee: Number(e.target.value) };
                setSettings({ ...settings, deliveryRules: rules });
              }} />
            </label>
            <label className="block">
              <span className="text-xs text-[#9b7766]">ফ্রি ডেলিভারি (min অর্ডার ৳)</span>
              <input className="field mt-1" type="number" value={rule.minOrderForFree ?? ""} onChange={(e) => {
                const rules = [...settings.deliveryRules];
                rules[i] = { ...rule, minOrderForFree: Number(e.target.value) || undefined };
                setSettings({ ...settings, deliveryRules: rules });
              }} />
            </label>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input type="checkbox" checked={rule.active} onChange={(e) => {
                const rules = [...settings.deliveryRules];
                rules[i] = { ...rule, active: e.target.checked };
                setSettings({ ...settings, deliveryRules: rules });
              }} />
              সক্রিয়
            </label>
          </div>
        ))}
        <div className="flex gap-2">
          <FashionButton variant="secondary" onClick={addDeliveryRule}>+ নতুন জেলা</FashionButton>
          <FashionButton onClick={saveDelivery}>{copy.actions.save}</FashionButton>
        </div>
      </AdminModal>

      {/* Coupons Modal */}
      <AdminModal open={activeTab === "coupons"} onClose={() => setActiveTab(null)} title={copy.admin.coupons} subtitle="যোগ, মুছুন, মেয়াদ শেষ হলে অটো বন্ধ" theme="violet" wide>
        <form onSubmit={saveCoupon} className="mb-6 space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
          <p className="font-semibold">নতুন / এডিট কুপন</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="field" placeholder="কুপন কোড (যেমন SLOW20)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
            <select className="field" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as "percent" | "fixed" })}>
              <option value="percent">% ছাড়</option>
              <option value="fixed">নির্দিষ্ট টাকা ছাড়</option>
            </select>
            <input className="field" type="number" placeholder="ছাড়ের পরিমাণ" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} required />
            <input className="field" type="datetime-local" value={couponForm.expiresAt?.slice(0, 16) ?? ""} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <FashionButton type="submit">{copy.actions.save}</FashionButton>
        </form>
        <div className="space-y-2">
          {coupons.map((coupon) => {
            const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            return (
              <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/6 bg-white/80 p-4">
                <div>
                  <p className="font-semibold">{coupon.code}</p>
                  <p className="text-sm text-[#8b6456]">
                    {coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatBdt(coupon.discountValue)}
                    {coupon.expiresAt ? ` · ${expired ? "মেয়াদ শেষ" : new Date(coupon.expiresAt).toLocaleString("bn-BD")}` : " · কোনো মেয়াদ নেই"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm font-semibold" onClick={() => setCouponForm(coupon)}>{copy.actions.edit}</button>
                  <button type="button" className="text-sm font-semibold text-red-700" onClick={() => removeCoupon(coupon.id)}>{copy.actions.delete}</button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminModal>

      {/* Settings Modal */}
      <AdminModal open={activeTab === "settings"} onClose={() => setActiveTab(null)} title={copy.admin.settings} subtitle="কোড ছাড়াই পুরো ওয়েবসাইট এডিট" theme="gold" wide>
        {settings ? (
          <div className="space-y-6">
            <section className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <h3 className="font-semibold">ব্র্যান্ড ও হিরো</h3>
              {[
                ["brandName", "ব্র্যান্ড নাম"],
                ["brandTagline", "ট্যাগলাইন"],
                ["heroTitle", "হিরো শিরোনাম"],
                ["heroSubtitle", "হিরো সাবটাইটেল"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-xs text-[#9b7766]">{label}</span>
                  <input className="field mt-1" value={String(settings[key as keyof StoreSettings] ?? "")} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                </label>
              ))}
              <label className="block">
                <span className="text-xs text-[#9b7766]">হিরো বর্ণনা</span>
                <textarea className="field mt-1 min-h-24" value={settings.heroDescription ?? ""} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} />
              </label>
            </section>

            <section className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <h3 className="font-semibold">যোগাযোগ</h3>
              {[
                ["contactEmail", "ইমেইল"],
                ["contactPhone", "ফোন"],
                ["whatsapp", "WhatsApp"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-xs text-[#9b7766]">{label}</span>
                  <input className="field mt-1" value={String(settings[key as keyof StoreSettings] ?? "")} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                </label>
              ))}
              <label className="block">
                <span className="text-xs text-[#9b7766]">ফুটার টেক্সট</span>
                <textarea className="field mt-1 min-h-20" value={settings.footerText ?? ""} onChange={(e) => setSettings({ ...settings, footerText: e.target.value })} />
              </label>
            </section>

            <section className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">হোমপেজ ব্যানার (পূর্ণ প্রস্থ, ছোট উচ্চতা)</h3>
                <FashionButton variant="secondary" onClick={addBanner}>+ ব্যানার</FashionButton>
              </div>
              <p className="text-xs text-[#8b6456]">বাম থেকে ডানে পুরো width, advertisement style — ইমেজ আপলোড করুন</p>
              {(settings.promoBanners ?? []).map((banner) => (
                <div key={banner.id} className="rounded-xl border border-black/5 bg-[#fffaf7] p-3 space-y-2">
                  <input className="field" placeholder="শিরোনাম" value={banner.title ?? ""} onChange={(e) => {
                    setSettings({ ...settings, promoBanners: settings.promoBanners!.map((b) => b.id === banner.id ? { ...b, title: e.target.value } : b) });
                  }} />
                  <input className="field" placeholder="প্রোডাক্ট slug (লিংক)" value={banner.linkSlug ?? ""} onChange={(e) => {
                    setSettings({ ...settings, promoBanners: settings.promoBanners!.map((b) => b.id === banner.id ? { ...b, linkSlug: e.target.value } : b) });
                  }} />
                  <input className="field" type="datetime-local" value={banner.expiresAt?.slice(0, 16) ?? ""} onChange={(e) => {
                    setSettings({ ...settings, promoBanners: settings.promoBanners!.map((b) => b.id === banner.id ? { ...b, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined } : b) });
                  }} />
                  {banner.imageUrl ? (
                    <div className="h-20 w-full rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${banner.imageUrl})` }} />
                  ) : null}
                  <FashionButton type="button" variant="secondary" onClick={() => { setUploadBannerId(banner.id); bannerFileRef.current?.click(); }} disabled={uploading}>
                    {uploading ? "আপলোড..." : "ব্যানার ইমেজ আপলোড"}
                  </FashionButton>
                </div>
              ))}
              <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadBannerId) void handleUpload(file, "banner", uploadBannerId);
              }} />
            </section>

            <section className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <h3 className="font-semibold">প্রাইসিং</h3>
              <input className="field" type="number" value={settings.defaultMarkupPercent} onChange={(e) => setSettings({ ...settings, defaultMarkupPercent: Number(e.target.value) })} placeholder="ডিফল্ট মার্কআপ %" />
              <select className="field" value={settings.pricingMode} onChange={(e) => setSettings({ ...settings, pricingMode: e.target.value as "markup" | "manual" })}>
                <option value="markup">কেনা দাম + % মার্কআপ</option>
                <option value="manual">ম্যানুয়াল সেল প্রাইস</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.showCouponsOnHome ?? true} onChange={(e) => setSettings({ ...settings, showCouponsOnHome: e.target.checked })} />
                হোমপেজে কুপন দেখান
              </label>
            </section>

            <FashionButton onClick={saveSettings}>{copy.actions.save}</FashionButton>
          </div>
        ) : null}
      </AdminModal>

      {/* Analytics Modal */}
      <AdminModal open={activeTab === "analytics"} onClose={() => setActiveTab(null)} title={copy.admin.analytics} theme="slate" wide>
        {analytics ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(["daily", "monthly"] as const).map((period) => {
              const a = analytics[period];
              return (
                <div key={period} className="rounded-2xl border border-black/6 bg-white/80 p-5">
                  <h3 className="font-bold">{period === "daily" ? "আজকের হিসাব" : "মাসিক হিসাব"}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><dt>বিক্রয়</dt><dd>{formatBdt(a.revenue)}</dd></div>
                    <div className="flex justify-between"><dt>খরচ</dt><dd>{formatBdt(a.cost)}</dd></div>
                    <div className="flex justify-between"><dt>লাভ</dt><dd>{formatBdt(a.profit)}</dd></div>
                    <div className="flex justify-between"><dt>ডেলিভারি</dt><dd>{formatBdt(a.deliveryFees)}</dd></div>
                    <div className="flex justify-between"><dt>অর্ডার</dt><dd>{a.orderCount}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
        ) : null}
      </AdminModal>

      {/* Reports Modal */}
      <AdminModal open={activeTab === "reports"} onClose={() => setActiveTab(null)} title={copy.admin.reports} theme="pearl" wide>
        <FashionButton onClick={() => window.print()}>{copy.actions.print}</FashionButton>
        <div className="mt-6 print:block">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="py-2 text-left">ID</th><th className="py-2 text-left">Customer</th><th className="py-2">Status</th><th className="py-2 text-right">Total</th></tr></thead>
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
      </AdminModal>

      {/* Product Edit Modal */}
      {productModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2b1d19]/50 p-4 backdrop-blur-md">
          <form onSubmit={saveProduct} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-[#e8c4b0]/60 bg-[linear-gradient(160deg,#fff8f4,#fdeee4)] p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4a2f28]">
                {editingId ? copy.actions.edit : copy.actions.create}
              </h2>
              <button type="button" onClick={() => setProductModalOpen(false)} className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">✕</button>
            </div>
            {form.imageUrl ? (
              <div className="h-32 w-full rounded-2xl bg-cover bg-center ring-2 ring-[#f4d4c2]/50" style={{ backgroundImage: `url(${form.imageUrl})` }} />
            ) : null}
            {[
              ["nameBn", "নাম (বাংলা)"],
              ["name", "নাম (English)"],
              ["buyPrice", "কেনা দাম"],
              ["price", "বিক্রয় দাম"],
              ["stock", "স্টক"],
              ["categorySlug", "ক্যাটাগরি"],
              ["fabric", "ফ্যাব্রিক"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm text-[#9b7766]">{label}</span>
                <input
                  className="field mt-1"
                  value={String(form[key as keyof ProductInput] ?? "")}
                  onChange={(e) => setForm((c) => ({
                    ...c,
                    [key]: ["price", "buyPrice", "stock", "offerDiscountPercent"].includes(key) ? Number(e.target.value) : e.target.value,
                  }))}
                  required={["nameBn", "name", "categorySlug"].includes(key)}
                />
              </label>
            ))}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file, "product");
            }} />
            <FashionButton type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "আপলোড..." : copy.actions.upload}
            </FashionButton>
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
            <FashionButton type="submit">{copy.actions.save}</FashionButton>
          </form>
        </div>
      ) : null}

      <AdminConfirmModal
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={confirmOrderStatus}
        title="অর্ডার স্ট্যাটাস নিশ্চিত করুন"
        message={pendingStatus ? `${copy.orderStatus[pendingStatus.status]} স্ট্যাটাসে পরিবর্তন করতে চান?` : ""}
        confirmLabel="হ্যাঁ, আপডেট করুন"
        theme="ocean"
      />

      <AdminSuccessModal
        open={Boolean(success)}
        onClose={() => setSuccess(null)}
        title={success?.title ?? ""}
        message={success?.message ?? ""}
        theme={success?.theme ?? activeTheme}
      />
    </AdminShell>
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
    <AdminShell>
      <section className="mx-auto max-w-md py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{copy.admin.loginTitle}</h1>
        <p className="mt-2 text-sm text-[#8b6456]">Slowgun Admin Panel</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-[#e8c4b0]/50 bg-white/80 p-6 shadow-lg">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required />
          <FashionButton type="submit">Login</FashionButton>
        </form>
      </section>
    </AdminShell>
  );
}
