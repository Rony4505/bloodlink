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
import { OrderInvoiceView } from "@/components/fashion/admin/OrderInvoiceView";
import { ReportContent, type ReportType } from "@/components/fashion/admin/ReportContent";
import { adminThemes, type AdminTheme } from "@/components/fashion/admin/admin-themes";
import { copy } from "@/lib/fashion/copy";
import { bangladeshDistricts } from "@/lib/fashion/districts";
import { formatBdt } from "@/lib/fashion/format";
import type {
  AdminNotification,
  AnalyticsSummary,
  AdvertiseKind,
  Category,
  Coupon,
  FashionOrder,
  OrderStatus,
  Product,
  ProductInput,
  PromoBanner,
  StoreSettings,
} from "@/lib/fashion/types";

type Tab = "products" | "orders" | "delivery" | "coupons" | "offers-product" | "settings" | "analytics" | "reports";
type ProductSubTab = "inventory" | "categories";
type OffersSubTab = "offers" | "advertisement";

const emptyProduct: ProductInput = {
  name: "", nameBn: "", price: 0, buyPrice: 0, categorySlug: "festive",
  description: "", descriptionBn: "", fabric: "", sizes: ["S", "M", "L"],
  colors: [{ name: "Default", hex: "#f8efe9" }], tone: "bg-[#f8efe9]",
  imageUrl: "https://images.unsplash.com/photo-1595777457582-31a4f8e1a5c5?auto=format&fit=crop&w=900&q=80",
  stock: 25, inStock: true, featured: false, pricingMode: "manual", advertiseActive: false,
};

const emptyCoupon: Coupon = {
  id: "",
  code: "",
  discountType: "percent",
  discountValue: 10,
  active: true,
  productIds: [],
  description: "",
};

const emptyBanner: PromoBanner = {
  id: "",
  imageUrl: "",
  title: "",
  badgeLabel: "অফার",
  advertiseKind: "offer",
  active: true,
  sortOrder: 0,
};

const statusOptions: OrderStatus[] = ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "cancelled"];

const menuItems: { id: Tab; label: string; theme: AdminTheme; hint: string }[] = [
  { id: "products", label: copy.admin.products, theme: "rose", hint: "স্টক + ক্যাটাগরি" },
  { id: "orders", label: copy.admin.orders, theme: "ocean", hint: "ট্র্যাকিং" },
  { id: "delivery", label: copy.admin.delivery, theme: "sunset", hint: "জেলা স্ক্রল" },
  { id: "coupons", label: copy.admin.coupons, theme: "violet", hint: "কুপন কোড" },
  { id: "offers-product", label: copy.admin.offersProduct, theme: "gold", hint: "Offers + Ads" },
  { id: "settings", label: copy.admin.settings, theme: "gold", hint: "ওয়েবসাইট" },
  { id: "analytics", label: copy.admin.analytics, theme: "slate", hint: "হিসাব" },
  { id: "reports", label: copy.admin.reports, theme: "pearl", hint: "রিপোর্ট" },
];

export function FashionAdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>("inventory");
  const [offersSubTab, setOffersSubTab] = useState<OffersSubTab>("offers");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [analytics, setAnalytics] = useState<{ daily: AnalyticsSummary; monthly: AnalyticsSummary } | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>(emptyCoupon);
  const [bannerForm, setBannerForm] = useState<PromoBanner>(emptyBanner);
  const [offerEditId, setOfferEditId] = useState<string>("");
  const [offerLabel, setOfferLabel] = useState("অফার");
  const [offerDiscount, setOfferDiscount] = useState(10);
  const [offerExpiresAt, setOfferExpiresAt] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<FashionOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<FashionOrder | null>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string; theme: AdminTheme } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("Dhaka");
  const [districtSearch, setDistrictSearch] = useState("");
  const [newSize, setNewSize] = useState("");
  const [productNewSize, setProductNewSize] = useState("");
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [newCategoryTitleBn, setNewCategoryTitleBn] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [advertiseModalOpen, setAdvertiseModalOpen] = useState(false);
  const [advertiseKind, setAdvertiseKind] = useState<AdvertiseKind>("new");
  const [advertiseLabel, setAdvertiseLabel] = useState("");
  const [uploadBannerId, setUploadBannerId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await Promise.all([
      fetch("/api/fashion/products"), fetch("/api/fashion/orders"), fetch("/api/fashion/categories"),
      fetch("/api/fashion/coupons"), fetch("/api/fashion/settings"),
      fetch("/api/fashion/analytics?period=daily"), fetch("/api/fashion/analytics?period=monthly"),
      fetch("/api/fashion/notifications?scope=admin"),
    ]);
    if (res[0].status === 401) { router.push("/store-admin/login"); return; }
    const [p, o, c, cp, s, d, m, n] = await Promise.all(res.map((r) => r.json()));
    setProducts(p.products ?? []);
    setOrders(o.orders ?? []);
    setCategories(c.categories ?? []);
    setCoupons(cp.coupons ?? []);
    setSettings(s.settings ?? null);
    setBanners(s.settings?.promoBanners ?? []);
    setAnalytics({ daily: d.analytics, monthly: m.analytics });
    setAdminNotifications(n.notifications ?? []);
  }

  useEffect(() => { void load(); }, [router]);

  function showSuccess(title: string, message: string, theme: AdminTheme) {
    setSuccess({ title, message, theme });
  }

  const inventoryProducts = products.filter((p) => {
    if (selectedCategorySlug && p.categorySlug !== selectedCategorySlug) return false;
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.nameBn, p.id, p.slug].join(" ").toLowerCase().includes(q);
  });

  const filteredCategories = categories.filter((c) => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return true;
    return [c.titleBn, c.title, c.slug, c.subtitle].join(" ").toLowerCase().includes(q);
  });

  function openProductEdit(product: Product) {
    setEditingId(product.id);
    setUseNewCategory(false);
    setForm({
      ...product,
      featured: product.featured ?? false,
      advertiseActive:
        product.advertiseActive ??
        settings?.promoBanners?.some((b) => b.productId === product.id && b.active) ??
        false,
      advertiseKind: product.advertiseKind,
      advertiseLabel: product.advertiseLabel,
    });
    setProductModalOpen(true);
  }

  function openProductCreate() {
    setEditingId(null);
    setUseNewCategory(false);
    setNewCategoryTitleBn("");
    setNewCategorySlug("");
    setForm({
      ...emptyProduct,
      categorySlug: selectedCategorySlug || categories[0]?.slug || "festive",
      sizes: settings?.availableSizes?.slice(0, 3) ?? emptyProduct.sizes,
    });
    setProductModalOpen(true);
  }

  function toggleProductSize(size: string) {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((s) => s !== size)
        : [...current.sizes, size],
    }));
  }

  async function addProductSize() {
    const size = productNewSize.trim();
    if (!size || !settings) return;
    const availableSizes = [...new Set([...(settings.availableSizes ?? []), size])];
    setSettings({ ...settings, availableSizes });
    setForm((current) => ({ ...current, sizes: [...new Set([...current.sizes, size])] }));
    setProductNewSize("");
    await fetch("/api/fashion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableSizes }),
    });
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    let categorySlug = form.categorySlug;

    if (useNewCategory) {
      const slug = newCategorySlug.trim() || `cat-${Date.now()}`;
      const cat: Category = {
        slug,
        title: newCategoryTitleBn.trim() || "New Category",
        titleBn: newCategoryTitleBn.trim() || "নতুন ক্যাটাগরি",
        subtitle: "",
        accent: "from-[#f5e8dc] via-[#fffaf6] to-[#ead5c3]",
        description: "",
      };
      const updatedCategories = categories.some((c) => c.slug === cat.slug)
        ? categories
        : [...categories, cat];
      const catRes = await fetch("/api/fashion/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: updatedCategories }),
      });
      if (!catRes.ok) return;
      categorySlug = cat.slug;
      setCategories(updatedCategories);
    }

    const res = await fetch(editingId ? `/api/fashion/products/${editingId}` : "/api/fashion/products", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categorySlug, pricingMode: "manual" }),
    });
    if (!res.ok) return;
    setProductModalOpen(false);
    setUseNewCategory(false);
    setNewCategoryTitleBn("");
    setNewCategorySlug("");
    showSuccess("সফল!", "প্রোডাক্ট সংরক্ষণ হয়েছে", "rose");
    await load();
  }

  async function confirmDeleteProduct() {
    if (!pendingDeleteProduct) return;
    const res = await fetch(`/api/fashion/products/${pendingDeleteProduct.id}`, { method: "DELETE" });
    setPendingDeleteProduct(null);
    if (!res.ok) return;
    showSuccess("মুছে ফেলা হয়েছে", `${pendingDeleteProduct.nameBn} সরানো হয়েছে`, "rose");
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
      setSettings({ ...settings, promoBanners: (settings.promoBanners ?? []).map((b) => b.id === bannerId ? { ...b, imageUrl: data.url } : b) });
    }
  }

  async function saveCategories() {
    await fetch("/api/fashion/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categories }) });
    showSuccess("সফল!", "ক্যাটাগরি আপডেট হয়েছে", "sage");
    await load();
  }

  async function addCategory() {
    const cat: Category = {
      slug: `cat-${Date.now()}`, title: "New Category", titleBn: "নতুন ক্যাটাগরি",
      subtitle: "", accent: "from-[#f5e8dc] via-[#fffaf6] to-[#ead5c3]", description: "",
    };
    setCategories([...categories, cat]);
  }

  async function removeCategory(slug: string) {
    await fetch(`/api/fashion/categories?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    setCategories(categories.filter((c) => c.slug !== slug));
    showSuccess("মুছে ফেলা হয়েছে", "ক্যাটাগরি সরানো হয়েছে", "sage");
  }

  async function saveSizes() {
    if (!settings) return;
    await fetch("/api/fashion/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ availableSizes: settings.availableSizes }) });
    showSuccess("সফল!", "সাইজ লিস্ট সেভ হয়েছে", "rose");
    await load();
  }

  function addSize() {
    if (!settings || !newSize.trim()) return;
    const sizes = [...(settings.availableSizes ?? []), newSize.trim()];
    setSettings({ ...settings, availableSizes: [...new Set(sizes)] });
    setNewSize("");
  }

  function removeSize(size: string) {
    if (!settings) return;
    setSettings({ ...settings, availableSizes: (settings.availableSizes ?? []).filter((s) => s !== size) });
  }

  async function saveSettings() {
    if (!settings) return;
    await fetch("/api/fashion/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    showSuccess("সফল!", "ওয়েবসাইট সেটিংস সেভ হয়েছে", "gold");
    await load();
  }

  async function saveDelivery() {
    if (!settings) return;
    await fetch("/api/fashion/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryRules: settings.deliveryRules }) });
    showSuccess("সফল!", "ডেলিভারি নিয়ম সেভ হয়েছে", "sunset");
    await load();
  }

  async function saveCoupon(event: FormEvent) {
    event.preventDefault();
    const coupon = { ...couponForm, id: couponForm.id || `cp${Date.now()}` };
    await fetch("/api/fashion/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coupon) });
    setCouponForm(emptyCoupon);
    showSuccess("সফল!", `কুপন ${coupon.code} সেভ হয়েছে`, "violet");
    await load();
  }

  async function removeCoupon(id: string) {
    await fetch(`/api/fashion/coupons?id=${id}`, { method: "DELETE" });
    showSuccess("মুছে ফেলা হয়েছে", "কুপন সরানো হয়েছে", "violet");
    await load();
  }

  async function saveProductOffer(event: FormEvent) {
    event.preventDefault();
    const product = products.find((p) => p.id === offerEditId);
    if (!product) return;
    const res = await fetch(`/api/fashion/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        offerActive: true,
        offerLabel,
        offerDiscountPercent: offerDiscount,
        offerExpiresAt: offerExpiresAt ? new Date(offerExpiresAt).toISOString() : undefined,
        pricingMode: "manual",
      }),
    });
    if (!res.ok) return;
    setOfferEditId("");
    setOfferExpiresAt("");
    showSuccess("সফল!", "Offer সেট হয়েছে", "gold");
    await load();
  }

  async function removeProductOffer(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    await fetch(`/api/fashion/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...product,
        offerActive: false,
        offerLabel: undefined,
        offerDiscountPercent: undefined,
        offerExpiresAt: undefined,
        pricingMode: "manual",
      }),
    });
    showSuccess("মুছে ফেলা হয়েছে", "Offer সরানো হয়েছে", "gold");
    await load();
  }

  async function saveBanner(event: FormEvent) {
    event.preventDefault();
    const product = bannerForm.productId ? products.find((p) => p.id === bannerForm.productId) : undefined;
    const payload: PromoBanner = {
      ...bannerForm,
      id: bannerForm.id || `pb${Date.now()}`,
      imageUrl: bannerForm.imageUrl || product?.imageUrl || "",
      linkSlug: product?.slug || bannerForm.linkSlug,
      title: bannerForm.title || product?.nameBn || "Advertisement",
      sortOrder: bannerForm.sortOrder || Date.now(),
      expiresAt: bannerForm.expiresAt || undefined,
      active: true,
    };
    await fetch("/api/fashion/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBannerForm(emptyBanner);
    showSuccess("সফল!", "Advertisement সেভ হয়েছে", "gold");
    await load();
  }

  async function removeBanner(id: string) {
    await fetch(`/api/fashion/banners?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    showSuccess("মুছে ফেলা হয়েছে", "Advertisement সরানো হয়েছে", "gold");
    await load();
  }

  async function confirmOrderStatus() {
    if (!pendingStatus) return;
    const { orderId, status } = pendingStatus;
    const res = await fetch(`/api/fashion/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message: `অর্ডার ${copy.orderStatus[status]} হয়েছে` }),
    });
    const data = await res.json();
    setPendingStatus(null);
    if (data.order) {
      setSelectedOrder(data.order);
      if (status === "confirmed") setInvoiceOrder(data.order as FashionOrder);
    }
    showSuccess("অর্ডার আপডেট!", `${copy.orderStatus[status]} স্ট্যাটাস সেট হয়েছে`, "ocean");
    await load();
  }

  function getRuleForDistrict(district: string) {
    return settings?.deliveryRules.find((r) => r.district === district);
  }

  function upsertDistrictRule(district: string) {
    if (!settings) return;
    const existing = settings.deliveryRules.find((r) => r.district === district);
    if (existing) return;
    setSettings({
      ...settings,
      deliveryRules: [...settings.deliveryRules, { id: `d${Date.now()}`, district, fee: 120, minOrderForFree: 7000, active: true }],
    });
  }

  const activeRule = getRuleForDistrict(selectedDistrict);
  const activeRuleIndex = settings?.deliveryRules.findIndex((r) => r.district === selectedDistrict) ?? -1;
  function openAdvertiseSetup() {
    setAdvertiseKind(form.advertiseKind ?? "new");
    setAdvertiseLabel(form.advertiseLabel ?? "");
    setAdvertiseModalOpen(true);
  }

  function confirmAdvertiseSetup() {
    setForm((current) => ({
      ...current,
      advertiseActive: true,
      advertiseKind,
      advertiseLabel: advertiseKind === "custom" ? advertiseLabel.trim() : undefined,
    }));
    setAdvertiseModalOpen(false);
  }

  function disableAdvertise() {
    setForm((current) => ({
      ...current,
      advertiseActive: false,
      advertiseKind: undefined,
      advertiseLabel: undefined,
    }));
  }

  const unreadCount = adminNotifications.filter((n) => !n.read).length;
  const filteredDistricts = bangladeshDistricts.filter((d) => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return true;
    return d.toLowerCase().includes(q);
  });

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9b7766]">Founder</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">{copy.admin.title}</h1>
          {unreadCount > 0 ? <p className="mt-2 text-sm text-[#b86a2e]">{unreadCount} নতুন অর্ডার</p> : null}
        </div>
        <FashionButton variant="secondary" onClick={async () => { await fetch("/api/fashion/admin", { method: "DELETE" }); router.push("/store-admin/login"); }}>{copy.nav.logout}</FashionButton>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {menuItems.map((item) => {
          const t = adminThemes[item.theme];
          return (
            <button key={item.id} type="button" onClick={() => setActiveTab(item.id)}
              className={`rounded-[1.75rem] border p-5 text-left shadow-[0_16px_50px_rgba(43,29,25,0.08)] transition hover:-translate-y-1 ${t.gradient} ${t.border}`}>
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold">{item.label}</p>
              <p className="mt-1 text-sm text-[#7a5c50]">{item.hint}</p>
            </button>
          );
        })}
      </div>

      {/* Products Modal */}
      <AdminModal open={activeTab === "products"} onClose={() => setActiveTab(null)} title={copy.admin.products} subtitle="ইনভেন্টরি, স্টক, ক্যাটাগরি ও সাইজ" theme="rose" wide>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setProductSubTab("inventory")} className={`rounded-full px-4 py-2 text-sm font-semibold ${productSubTab === "inventory" ? "bg-[#e8b896] text-[#3d2a24]" : "bg-white/70"}`}>ইনভেন্টরি</button>
          <button type="button" onClick={() => setProductSubTab("categories")} className={`rounded-full px-4 py-2 text-sm font-semibold ${productSubTab === "categories" ? "bg-[#b5d4b5] text-[#2d4a32]" : "bg-white/70"}`}>ক্যাটাগরি ও সাইজ</button>
        </div>

        {productSubTab === "inventory" ? (
          <>
            <div className="flex flex-wrap gap-2">
              <input className="field flex-1 min-w-[200px]" placeholder="প্রোডাক্ট সার্চ..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              <select className="field w-auto" value={selectedCategorySlug} onChange={(e) => setSelectedCategorySlug(e.target.value)}>
                <option value="">সব ক্যাটাগরি</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.titleBn}</option>)}
              </select>
              <FashionButton onClick={openProductCreate}>{copy.actions.create}</FashionButton>
            </div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">মোট {inventoryProducts.length} প্রোডাক্ট</p>
              {inventoryProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-2xl border border-black/6 bg-white/80 px-4 py-3">
                  <button type="button" onClick={() => openProductEdit(p)} className="flex flex-1 items-center justify-between text-left hover:opacity-90">
                    <div>
                      <p className="font-semibold">{p.nameBn}</p>
                      <p className="text-xs text-[#8b6456]">{p.categorySlug} · {p.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#8f624e]">{formatBdt(p.price)}</p>
                      <p className={`text-xs font-bold ${p.stock <= 5 ? "text-red-700" : "text-[#4a7350]"}`}>স্টক: {p.stock}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteProduct(p)}
                    className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    {copy.actions.delete}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <input className="field flex-1" placeholder="ক্যাটাগরি সার্চ..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
              <FashionButton variant="secondary" onClick={addCategory}>+ ক্যাটাগরি</FashionButton>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedCategorySlug("")} className={`rounded-full px-3 py-1 text-xs font-semibold ${!selectedCategorySlug ? "bg-[#b5d4b5]" : "bg-white/70"}`}>সব</button>
              {filteredCategories.map((c) => (
                <button key={c.slug} type="button" onClick={() => setSelectedCategorySlug(c.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedCategorySlug === c.slug ? "bg-[#b5d4b5]" : "bg-white/70"}`}>{c.titleBn}</button>
              ))}
            </div>
            <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
              {filteredCategories.map((cat, i) => (
                <div key={cat.slug} className="grid gap-2 rounded-xl border border-black/6 bg-white/80 p-3 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className="field" value={cat.titleBn} onChange={(e) => { const n = [...categories]; n[i] = { ...cat, titleBn: e.target.value }; setCategories(n); }} />
                    <input className="field" value={cat.slug} onChange={(e) => { const n = [...categories]; n[i] = { ...cat, slug: e.target.value }; setCategories(n); }} />
                  </div>
                  <button type="button" className="text-sm font-semibold text-red-700" onClick={() => removeCategory(cat.slug)}>{copy.actions.delete}</button>
                </div>
              ))}
            </div>
            <FashionButton className="mt-3" onClick={saveCategories}>{copy.actions.save} ক্যাটাগরি</FashionButton>

            <div className="mt-6 rounded-2xl border border-black/6 bg-white/80 p-4">
              <p className="font-semibold">সাইজ ম্যানেজমেন্ট</p>
              <div className="mt-2 flex gap-2">
                <input className="field flex-1" placeholder="নতুন সাইজ (যেমন XXL)" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
                <FashionButton variant="secondary" onClick={addSize}>যোগ</FashionButton>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(settings?.availableSizes ?? []).map((size) => (
                  <span key={size} className="inline-flex items-center gap-1 rounded-full bg-[#faf0ea] px-3 py-1 text-sm">
                    {size}
                    <button type="button" onClick={() => removeSize(size)} className="text-red-600">×</button>
                  </span>
                ))}
              </div>
              <FashionButton className="mt-3" variant="secondary" onClick={saveSizes}>সাইজ সেভ</FashionButton>
            </div>
          </>
        )}
      </AdminModal>

      {/* Orders Modal - list only */}
      <AdminModal open={activeTab === "orders"} onClose={() => setActiveTab(null)} title={copy.admin.orders} subtitle="অর্ডার select করলে tracking details popup আসবে" theme="ocean" wide>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto">
          {orders.map((order) => (
            <button key={order.id} type="button" onClick={() => setSelectedOrder(order)}
              className="flex w-full items-center justify-between rounded-2xl border border-black/6 bg-white/80 px-4 py-3 text-left hover:bg-white">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-[#8b6456]">{order.id} · {order.trackingNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatBdt(order.total)}</p>
                <p className="text-xs text-[#3d6a9e]">{copy.orderStatus[order.status]}</p>
              </div>
            </button>
          ))}
        </div>
      </AdminModal>

      {/* Order Detail Popup */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#2b1d19]/55 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-[#a8c8ef]/60 bg-[linear-gradient(145deg,#eef6ff,#f8fbff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{selectedOrder.customerName}</h2>
                <p className="text-sm text-[#3d6a9e]">Tracking: <strong>{selectedOrder.trackingNumber}</strong></p>
                <p className="text-xs text-[#6f554a]">{selectedOrder.id} · {selectedOrder.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">✕</button>
            </div>
            <p className="mt-3 text-sm">{selectedOrder.address}, {selectedOrder.district}</p>
            <p className="mt-2 font-semibold">{copy.orderStatus[selectedOrder.status]} · {formatBdt(selectedOrder.total)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {statusOptions.map((st) => (
                <button key={st} type="button" onClick={() => setPendingStatus({ orderId: selectedOrder.id, status: st })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedOrder.status === st ? "bg-[#a8c8ef] text-[#3d6a9e]" : "bg-white border border-black/8"}`}>
                  {copy.orderStatus[st]}
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-2 border-t border-black/5 pt-3 text-xs text-[#6f554a]">
              {selectedOrder.statusHistory?.map((h, i) => (
                <li key={i}>{new Date(h.updatedAt).toLocaleString("bn-BD")} — {h.message}</li>
              ))}
            </ul>
            <div className="mt-4">
              <FashionButton variant="secondary" onClick={() => setInvoiceOrder(selectedOrder)}>Invoice দেখুন</FashionButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Invoice Popup */}
      {invoiceOrder ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b1d19]/60 p-4 backdrop-blur-md print:bg-white print:p-0">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#e8c4b0]/60 bg-white p-6 shadow-2xl print:max-h-none print:shadow-none">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Invoice / PDF</h2>
              <button type="button" onClick={() => setInvoiceOrder(null)} className="rounded-full bg-[#faf4f0] px-3 py-1 text-sm font-semibold">✕</button>
            </div>
            <OrderInvoiceView order={invoiceOrder} settings={settings} />
          </div>
        </div>
      ) : null}

      {/* Delivery Modal - scroll districts */}
      <AdminModal open={activeTab === "delivery"} onClose={() => setActiveTab(null)} title={copy.admin.delivery} subtitle="জেলা সার্চ ও scroll — select করে ডানে এডিট" theme="sunset" wide>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="flex max-h-80 flex-col rounded-2xl border border-[#f0c49a]/50 bg-white/70 p-2">
            <input
              className="field mb-2 shrink-0 text-sm"
              placeholder="জেলা সার্চ বা টাইপ..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredDistricts.map((d) => {
                const hasRule = settings?.deliveryRules.some((r) => r.district === d);
                return (
                  <button key={d} type="button" onClick={() => { setSelectedDistrict(d); upsertDistrictRule(d); }}
                    className={`mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${selectedDistrict === d ? "bg-[#ffd4b8] text-[#6b3a1e]" : "hover:bg-[#fff8f0]"}`}>
                    {d} {hasRule ? "✓" : ""}
                  </button>
                );
              })}
              {filteredDistricts.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-[#9b7766]">কোনো জেলা পাওয়া যায়নি</p>
              ) : null}
            </div>
          </div>
          {activeRule && settings && activeRuleIndex >= 0 ? (
            <div className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <p className="font-semibold">{selectedDistrict} — ডেলিভারি সেটিং</p>
              <label className="block"><span className="text-xs text-[#9b7766]">ডেলিভারি ফি (৳)</span>
                <input className="field mt-1" type="number" value={activeRule.fee} onChange={(e) => {
                  const rules = [...settings.deliveryRules]; rules[activeRuleIndex] = { ...activeRule, fee: Number(e.target.value) };
                  setSettings({ ...settings, deliveryRules: rules });
                }} /></label>
              <label className="block"><span className="text-xs text-[#9b7766]">ফ্রি ডেলিভারি min (৳)</span>
                <input className="field mt-1" type="number" value={activeRule.minOrderForFree ?? ""} onChange={(e) => {
                  const rules = [...settings.deliveryRules]; rules[activeRuleIndex] = { ...activeRule, minOrderForFree: Number(e.target.value) || undefined };
                  setSettings({ ...settings, deliveryRules: rules });
                }} /></label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={activeRule.active} onChange={(e) => {
                  const rules = [...settings.deliveryRules]; rules[activeRuleIndex] = { ...activeRule, active: e.target.checked };
                  setSettings({ ...settings, deliveryRules: rules });
                }} /> সক্রিয়
              </label>
              <FashionButton onClick={saveDelivery}>{copy.actions.save}</FashionButton>
            </div>
          ) : null}
        </div>
      </AdminModal>

      {/* Coupons, Settings, Analytics modals - keep similar to before but condensed */}
      <AdminModal open={activeTab === "coupons"} onClose={() => setActiveTab(null)} title={copy.admin.coupons} theme="violet" wide>
        <form onSubmit={saveCoupon} className="mb-4 space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="field" placeholder="কুপন কোড" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required />
            <input className="field" type="number" placeholder="ছাড়" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} required />
            <select className="field" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as "percent" | "fixed" })}>
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed ৳</option>
            </select>
            <input className="field" type="number" placeholder="মিনিমাম অর্ডার (ঐচ্ছিক)" value={couponForm.minOrder ?? ""} onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) || undefined })} />
            <input className="field md:col-span-2" type="datetime-local" value={couponForm.expiresAt?.slice(0, 16) ?? ""} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
            <textarea className="field md:col-span-2 min-h-20" placeholder="কুপন বিবরণ" value={couponForm.description ?? ""} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-[#9b7766]">প্রযোজ্য প্রোডাক্ট (খালি = সব)</p>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-black/6 bg-white p-2">
              {products.map((p) => {
                const checked = couponForm.productIds?.includes(p.id) ?? false;
                return (
                  <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-[#faf4f0]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const ids = new Set(couponForm.productIds ?? []);
                        if (e.target.checked) ids.add(p.id);
                        else ids.delete(p.id);
                        setCouponForm({ ...couponForm, productIds: [...ids] });
                      }}
                    />
                    {p.nameBn}
                  </label>
                );
              })}
            </div>
          </div>
          <FashionButton type="submit">{copy.actions.save}</FashionButton>
        </form>
        {coupons.map((coupon) => (
          <div key={coupon.id} className="mb-2 flex justify-between rounded-xl border border-black/6 bg-white/80 p-3">
            <div>
              <span className="font-semibold">{coupon.code}</span>
              <p className="text-xs text-[#8b6456]">
                {coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatBdt(coupon.discountValue)}
                {coupon.expiresAt ? ` · ${new Date(coupon.expiresAt).toLocaleDateString("bn-BD")} পর্যন্ত` : ""}
                {coupon.productIds?.length ? ` · ${coupon.productIds.length} প্রোডাক্ট` : " · সব প্রোডাক্ট"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCouponForm(coupon)}>{copy.actions.edit}</button>
              <button type="button" className="text-red-700" onClick={() => removeCoupon(coupon.id)}>{copy.actions.delete}</button>
            </div>
          </div>
        ))}
      </AdminModal>

      <AdminModal open={activeTab === "offers-product"} onClose={() => setActiveTab(null)} title={copy.admin.offersProduct} subtitle="Offers ও Advertisement — নির্দিষ্ট তারিখ পর্যন্ত, পরে auto delete" theme="gold" wide>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setOffersSubTab("offers")} className={`rounded-full px-4 py-2 text-sm font-semibold ${offersSubTab === "offers" ? "bg-[#e8b896] text-[#3d2a24]" : "bg-white/70"}`}>Offers</button>
          <button type="button" onClick={() => setOffersSubTab("advertisement")} className={`rounded-full px-4 py-2 text-sm font-semibold ${offersSubTab === "advertisement" ? "bg-[#e8b896] text-[#3d2a24]" : "bg-white/70"}`}>Advertisement</button>
        </div>

        {offersSubTab === "offers" ? (
          <div className="space-y-4">
            <form onSubmit={saveProductOffer} className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <select className="field" value={offerEditId} onChange={(e) => setOfferEditId(e.target.value)} required>
                <option value="">প্রোডাক্ট select করুন</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.nameBn} — {formatBdt(p.price)}</option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-3">
                <input className="field" placeholder="Offer label" value={offerLabel} onChange={(e) => setOfferLabel(e.target.value)} required />
                <input className="field" type="number" placeholder="Discount %" value={offerDiscount} onChange={(e) => setOfferDiscount(Number(e.target.value))} required />
                <input className="field" type="datetime-local" value={offerExpiresAt} onChange={(e) => setOfferExpiresAt(e.target.value)} />
              </div>
              <p className="text-xs text-[#9b7766]">Expiry date দিলে সেই সময়ের পর offer auto delete হবে</p>
              <FashionButton type="submit">Offer সেভ</FashionButton>
            </form>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {products.filter((p) => p.offerActive).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-black/6 bg-white/80 px-4 py-3">
                  <div>
                    <p className="font-semibold">{p.nameBn}</p>
                    <p className="text-xs text-[#8b6456]">
                      {p.offerLabel} · {p.offerDiscountPercent}% ছাড়
                      {p.offerExpiresAt ? ` · ${new Date(p.offerExpiresAt).toLocaleString("bn-BD")} পর্যন্ত` : ""}
                    </p>
                  </div>
                  <button type="button" className="text-sm font-semibold text-red-700" onClick={() => removeProductOffer(p.id)}>{copy.actions.delete}</button>
                </div>
              ))}
              {products.filter((p) => p.offerActive).length === 0 ? (
                <p className="text-sm text-[#9b7766]">এখন কোনো active offer নেই</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={saveBanner} className="space-y-3 rounded-2xl border border-black/6 bg-white/80 p-4">
              <select className="field" value={bannerForm.productId ?? ""} onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value);
                setBannerForm({
                  ...bannerForm,
                  productId: e.target.value || undefined,
                  imageUrl: product?.imageUrl || bannerForm.imageUrl,
                  linkSlug: product?.slug,
                  title: product?.nameBn || bannerForm.title,
                });
              }}>
                <option value="">প্রোডাক্ট select (ঐচ্ছিক)</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.nameBn}</option>)}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="field" placeholder="Title / label" value={bannerForm.title ?? ""} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} />
                <input className="field" placeholder="Badge (নতুন/ডিসকাউন্ট/...)" value={bannerForm.badgeLabel ?? ""} onChange={(e) => setBannerForm({ ...bannerForm, badgeLabel: e.target.value })} />
                <select className="field" value={bannerForm.advertiseKind ?? "offer"} onChange={(e) => setBannerForm({ ...bannerForm, advertiseKind: e.target.value as AdvertiseKind })}>
                  <option value="new">নতুন</option>
                  <option value="discount">ডিসকাউন্ট</option>
                  <option value="offer">অফার</option>
                  <option value="custom">কাস্টম</option>
                </select>
                <input className="field" type="datetime-local" value={bannerForm.expiresAt?.slice(0, 16) ?? ""} onChange={(e) => setBannerForm({ ...bannerForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
              </div>
              <input className="field" placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} required={!bannerForm.productId} />
              <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void (async () => {
                  setUploading(true);
                  const fd = new FormData();
                  fd.append("file", f);
                  const res = await fetch("/api/fashion/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  setUploading(false);
                  if (data.url) setBannerForm((c) => ({ ...c, imageUrl: data.url }));
                })();
              }} />
              <FashionButton type="button" variant="secondary" onClick={() => bannerFileRef.current?.click()} disabled={uploading}>{copy.actions.upload}</FashionButton>
              <p className="text-xs text-[#9b7766]">Expiry date দিলে সেই সময়ের পর advertisement auto delete হবে</p>
              <FashionButton type="submit">Advertisement সেভ</FashionButton>
            </form>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {banners.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/6 bg-white/80 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.title || b.badgeLabel || b.id}</p>
                    <p className="text-xs text-[#8b6456]">
                      {b.badgeLabel || b.advertiseKind || "ad"}
                      {b.expiresAt ? ` · ${new Date(b.expiresAt).toLocaleString("bn-BD")} পর্যন্ত` : ""}
                      {!b.active ? " · inactive" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setBannerForm(b)}>{copy.actions.edit}</button>
                    <button type="button" className="text-red-700" onClick={() => removeBanner(b.id)}>{copy.actions.delete}</button>
                  </div>
                </div>
              ))}
              {banners.length === 0 ? <p className="text-sm text-[#9b7766]">এখন কোনো advertisement নেই</p> : null}
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal open={activeTab === "settings"} onClose={() => setActiveTab(null)} title={copy.admin.settings} theme="gold" wide>
        {settings ? (
          <div className="space-y-4">
            {[["brandName", "ব্র্যান্ড"], ["brandTagline", "ট্যাগলাইন"], ["heroTitle", "হিরো"], ["contactPhone", "ফোন"], ["whatsapp", "WhatsApp"]].map(([key, label]) => (
              <label key={key} className="block"><span className="text-xs text-[#9b7766]">{label}</span>
                <input className="field mt-1" value={String(settings[key as keyof StoreSettings] ?? "")} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} /></label>
            ))}
            <FashionButton onClick={saveSettings}>{copy.actions.save}</FashionButton>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal open={activeTab === "analytics"} onClose={() => setActiveTab(null)} title={copy.admin.analytics} theme="slate" wide>
        {analytics ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(["daily", "monthly"] as const).map((period) => (
              <div key={period} className="rounded-2xl border border-black/6 bg-white/80 p-4">
                <h3 className="font-bold">{period === "daily" ? "আজ" : "মাস"}</h3>
                <p className="text-sm">বিক্রয়: {formatBdt(analytics[period].revenue)} · লাভ: {formatBdt(analytics[period].profit)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </AdminModal>

      {/* Reports Modal - sub menus */}
      <AdminModal open={activeTab === "reports"} onClose={() => { setActiveTab(null); setReportType(null); }} title={copy.admin.reports} subtitle="রিপোর্ট select করুন" theme="pearl" wide>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["sell", "বিক্রয় রিপোর্ট"],
            ["delivery", "ডেলিভারি রিপোর্ট"],
            ["customer", "গ্রাহক রিপোর্ট"],
          ] as const).map(([type, label]) => (
            <button key={type} type="button" onClick={() => setReportType(type)}
              className="rounded-2xl border border-black/6 bg-white/80 p-5 text-left font-semibold transition hover:bg-white">
              {label}
            </button>
          ))}
        </div>
      </AdminModal>

      {reportType ? (
        <div className="fixed inset-0 z-[88] flex items-center justify-center bg-[#2b1d19]/55 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#d8cfc4]/60 bg-[#fdfcfa] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">রিপোর্ট</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="rounded-full bg-[#ebe3da] px-4 py-2 text-sm font-semibold">{copy.actions.print} / PDF</button>
                <button type="button" onClick={() => setReportType(null)} className="rounded-full bg-white px-3 py-1 text-sm">✕</button>
              </div>
            </div>
            <ReportContent type={reportType} orders={orders} />
          </div>
        </div>
      ) : null}

      {/* Product Edit Modal */}
      {productModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2b1d19]/50 p-4 backdrop-blur-md">
          <form onSubmit={saveProduct} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-[#e8c4b0]/60 bg-[linear-gradient(160deg,#fff8f4,#fdeee4)] p-6 shadow-2xl space-y-3">
            <div className="flex justify-between"><h2 className="text-2xl font-bold">{editingId ? copy.actions.edit : copy.actions.create}</h2>
              <button type="button" onClick={() => setProductModalOpen(false)}>✕</button></div>
            {[["nameBn", "নাম (বাংলা)"], ["name", "নাম"], ["buyPrice", "কেনা দাম"], ["price", "বিক্রয়"], ["stock", "স্টক"]].map(([key, label]) => (
              <label key={key} className="block"><span className="text-sm text-[#9b7766]">{label}</span>
                <input className="field mt-1" value={String(form[key as keyof ProductInput] ?? "")} onChange={(e) => setForm((c) => ({ ...c, [key]: ["price", "buyPrice", "stock"].includes(key) ? Number(e.target.value) : e.target.value }))} /></label>
            ))}
            <div className="block">
              <span className="text-sm text-[#9b7766]">ক্যাটাগরি</span>
              <select
                className="field mt-1"
                value={useNewCategory ? "__new__" : form.categorySlug}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setUseNewCategory(true);
                    return;
                  }
                  setUseNewCategory(false);
                  setForm((c) => ({ ...c, categorySlug: e.target.value }));
                }}
              >
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.titleBn}</option>)}
                <option value="__new__">+ নতুন ক্যাটাগরি তৈরি</option>
              </select>
              {useNewCategory ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className="field" placeholder="ক্যাটাগরি নাম (বাংলা)" value={newCategoryTitleBn} onChange={(e) => setNewCategoryTitleBn(e.target.value)} required />
                  <input className="field" placeholder="slug (ঐচ্ছিক)" value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} />
                </div>
              ) : null}
            </div>
            <div className="block">
              <span className="text-sm text-[#9b7766]">সাইজ</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {[...(settings?.availableSizes ?? []), ...form.sizes].filter((s, i, arr) => arr.indexOf(s) === i).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleProductSize(size)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${form.sizes.includes(size) ? "bg-[#e8b896] text-[#3d2a24]" : "border border-black/10 bg-white/80 text-[#6f554a]"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input className="field flex-1" placeholder="নতুন সাইজ যোগ (যেমন XXL)" value={productNewSize} onChange={(e) => setProductNewSize(e.target.value)} />
                <FashionButton type="button" variant="secondary" onClick={() => void addProductSize()}>যোগ</FashionButton>
              </div>
            </div>
            <div className="rounded-2xl border border-black/6 bg-white/80 p-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.advertiseActive)}
                  onChange={(e) => {
                    if (e.target.checked) openAdvertiseSetup();
                    else disableAdvertise();
                  }}
                />
                হোমপেজ advertise/carousel-এ দেখান
              </label>
              {form.advertiseActive ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6f554a]">
                  <span className="rounded-full bg-[#faf0ea] px-3 py-1 font-semibold">
                    {form.advertiseKind === "new"
                      ? "নতুন প্রোডাক্ট"
                      : form.advertiseKind === "discount"
                        ? "ডিসকাউন্ট"
                        : form.advertiseKind === "offer"
                          ? "অফার"
                          : form.advertiseLabel || "কাস্টম"}
                  </span>
                  <button type="button" className="font-semibold text-[#8f624e]" onClick={openAdvertiseSetup}>
                    advertise সেটিং পরিবর্তন
                  </button>
                </div>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(form.offerActive)} onChange={(e) => setForm((c) => ({ ...c, offerActive: e.target.checked }))} />
              অফার/ডিসকাউন্ট প্রোডাক্ট
            </label>
            {form.offerActive ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="field" placeholder="অফার লেবেল" value={form.offerLabel ?? ""} onChange={(e) => setForm((c) => ({ ...c, offerLabel: e.target.value }))} />
                <input className="field" type="number" placeholder="ছাড় %" value={form.offerDiscountPercent ?? ""} onChange={(e) => setForm((c) => ({ ...c, offerDiscountPercent: Number(e.target.value) || undefined }))} />
              </div>
            ) : null}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f, "product"); }} />
            <FashionButton type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>{copy.actions.upload}</FashionButton>
            <FashionButton type="submit">{copy.actions.save}</FashionButton>
          </form>
        </div>
      ) : null}

      <AdminConfirmModal open={Boolean(pendingStatus)} onClose={() => setPendingStatus(null)} onConfirm={confirmOrderStatus}
        title="স্ট্যাটাস নিশ্চিত করুন" message={pendingStatus ? `${copy.orderStatus[pendingStatus.status]}?` : ""} confirmLabel="হ্যাঁ" theme="ocean" />
      <AdminConfirmModal open={Boolean(pendingDeleteProduct)} onClose={() => setPendingDeleteProduct(null)} onConfirm={confirmDeleteProduct}
        title="প্রোডাক্ট মুছবেন?" message={pendingDeleteProduct ? `${pendingDeleteProduct.nameBn} স্থায়ীভাবে মুছে ফেলা হবে।` : ""} confirmLabel="মুছুন" theme="rose" />

      {advertiseModalOpen ? (
        <div className="fixed inset-0 z-[82] flex items-center justify-center bg-[#2b1d19]/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-[#e8c4b0]/60 bg-[linear-gradient(160deg,#fff8f4,#fdeee4)] p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">Advertise হিসেবে দেখাবেন?</h3>
            <p className="mt-2 text-sm text-[#6f554a]">homepage carousel-এ কী ধরনের advertise দেখাবে select করুন</p>
            <div className="mt-4 space-y-2">
              {([
                ["new", "নতুন প্রোডাক্ট"],
                ["discount", "ডিসকাউন্ট"],
                ["offer", "অফার"],
                ["custom", "অন্যান্য (নিজে লিখুন)"],
              ] as const).map(([kind, label]) => (
                <label key={kind} className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/6 bg-white/80 px-4 py-3">
                  <input type="radio" name="advertiseKind" checked={advertiseKind === kind} onChange={() => setAdvertiseKind(kind)} />
                  <span className="font-semibold">{label}</span>
                </label>
              ))}
            </div>
            {advertiseKind === "custom" ? (
              <input
                className="field mt-3"
                placeholder="যেমন: Summer Sale, Best Seller..."
                value={advertiseLabel}
                onChange={(e) => setAdvertiseLabel(e.target.value)}
              />
            ) : null}
            <div className="mt-5 flex gap-2">
              <FashionButton type="button" variant="secondary" className="flex-1" onClick={() => setAdvertiseModalOpen(false)}>
                {copy.actions.close}
              </FashionButton>
              <FashionButton type="button" className="flex-1" onClick={confirmAdvertiseSetup}>
                Confirm
              </FashionButton>
            </div>
          </div>
        </div>
      ) : null}

      <AdminSuccessModal open={Boolean(success)} onClose={() => setSuccess(null)} title={success?.title ?? ""} message={success?.message ?? ""} theme={success?.theme ?? "rose"} />
    </AdminShell>
  );
}

export function FashionAdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/fashion/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!res.ok) { setError("পাসওয়ার্ড সঠিক নয়"); return; }
    router.push("/store-admin");
  }
  return (
    <AdminShell>
      <section className="mx-auto max-w-md py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{copy.admin.loginTitle}</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-[#e8c4b0]/50 bg-white/80 p-6">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <FashionButton type="submit">Login</FashionButton>
        </form>
      </section>
    </AdminShell>
  );
}
