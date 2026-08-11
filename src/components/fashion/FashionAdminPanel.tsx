"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FashionButton } from "@/components/fashion/FashionButton";
import { FashionShell } from "@/components/fashion/FashionShell";
import { copy } from "@/lib/fashion/copy";
import { formatBdt } from "@/lib/fashion/format";
import type { FashionOrder, Product, ProductInput } from "@/lib/fashion/types";

const emptyProduct: ProductInput = {
  name: "",
  nameBn: "",
  price: 0,
  categorySlug: "festive",
  description: "",
  descriptionBn: "",
  fabric: "",
  sizes: ["S", "M", "L"],
  colors: [{ name: "Default", hex: "#f8efe9" }],
  tone: "bg-[#f8efe9]",
  imageUrl: "https://images.unsplash.com/photo-1595777457582-31a4f8e1a5c5?auto=format&fit=crop&w=900&q=80",
  inStock: true,
  featured: false,
};

export function FashionAdminPanel() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const [productRes, orderRes] = await Promise.all([
      fetch("/api/fashion/products"),
      fetch("/api/fashion/orders"),
    ]);

    if (productRes.status === 401 || orderRes.status === 401) {
      router.push("/store-admin/login");
      return;
    }

    const productData = await productRes.json();
    const orderData = await orderRes.json();
    setProducts(productData.products ?? []);
    setOrders(orderData.orders ?? []);
  }

  useEffect(() => {
    void load();
  }, [router]);

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `/api/fashion/products/${editingId}`
      : "/api/fashion/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setMessage("সেভ করা যায়নি");
      return;
    }

    setForm(emptyProduct);
    setEditingId(null);
    setMessage("প্রোডাক্ট সেভ হয়েছে");
    await load();
  }

  async function removeProduct(id: string) {
    await fetch(`/api/fashion/products/${id}`, { method: "DELETE" });
    await load();
  }

  async function logout() {
    await fetch("/api/fashion/admin", { method: "DELETE" });
    router.push("/store-admin/login");
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold">{copy.admin.title}</h1>
          <FashionButton variant="secondary" onClick={logout}>{copy.nav.logout}</FashionButton>
        </div>

        {message ? <p className="mt-4 text-sm text-[#8b6456]">{message}</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.admin.products}</h2>
            <div className="mt-4 space-y-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-[1.5rem] border border-black/6 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.nameBn}</p>
                      <p className="text-sm text-[#8b6456]">{formatBdt(product.price)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm font-semibold" onClick={() => { setEditingId(product.id); setForm({ ...product, featured: product.featured ?? false }); }}>{copy.actions.edit}</button>
                      <button className="text-sm font-semibold text-red-700" onClick={() => removeProduct(product.id)}>{copy.actions.delete}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <form onSubmit={saveProduct} className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-sm space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">{editingId ? copy.actions.edit : copy.actions.create}</h2>
            {[
              ["nameBn", "নাম (বাংলা)"],
              ["name", "নাম (English)"],
              ["price", "দাম"],
              ["categorySlug", "ক্যাটাগরি slug"],
              ["fabric", "ফ্যাব্রিক"],
              ["imageUrl", "ইমেজ URL"],
              ["tone", "Tone class"],
              ["descriptionBn", "বর্ণনা (বাংলা)"],
              ["description", "বর্ণনা (English)"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm text-[#9b7766]">{label}</span>
                <input
                  className="field mt-1"
                  value={String(form[key as keyof typeof form] ?? "")}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      [key]: key === "price" ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  required={["nameBn", "name", "price", "categorySlug", "imageUrl"].includes(key)}
                />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((c) => ({ ...c, featured: e.target.checked }))} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.inStock} onChange={(e) => setForm((c) => ({ ...c, inStock: e.target.checked }))} />
              In stock
            </label>
            <FashionButton type="submit">{copy.actions.save}</FashionButton>
          </form>
        </div>

        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">{copy.admin.orders}</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-[1.5rem] border border-black/6 bg-[#faf4f0] p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="font-semibold">{order.id} · {order.customerName}</p>
                  <p>{formatBdt(order.total)}</p>
                </div>
                <p className="mt-2 text-sm text-[#6f554a]">{order.phone} · {order.district}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
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
      setError("পাসওয়ার্ড সঠিক নয়");
      return;
    }
    router.push("/store-admin");
  }

  return (
    <FashionShell>
      <section className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{copy.admin.loginTitle}</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[2rem] border border-black/6 bg-white p-6">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required />
          <FashionButton type="submit">Login</FashionButton>
        </form>
      </section>
    </FashionShell>
  );
}
