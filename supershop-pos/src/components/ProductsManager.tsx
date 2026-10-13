"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { formatBdt } from "@/lib/money";
import type { Product, ProductCategory } from "@/lib/types";
import { ProductSwatch } from "./ProductSwatch";

type Props = {
  initialProducts: Product[];
  currency: string;
};

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "men" as ProductCategory,
  brand: "",
  price: "",
  cost: "",
  stock: "",
  sizes: "S, M, L, XL",
  colors: "Black, White",
};

export function ProductsManager({ initialProducts, currency }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").includes(q)
      );
    });
  }, [products, query]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: product.category,
      brand: product.brand || "",
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
    });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || undefined,
      category: form.category,
      brand: form.brand.trim() || undefined,
      price: Number(form.price),
      cost: Number(form.cost),
      stock: Number(form.stock),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const res = await fetch(
        editingId ? `/api/products/${editingId}` : "/api/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      if (editingId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? data.product : p)),
        );
      } else {
        setProducts((prev) => [data.product, ...prev]);
      }
      resetForm();
    });
  }

  function archive(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: false } : p)),
      );
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr]">
      <form
        onSubmit={onSubmit}
        className="panel anim-rise h-fit rounded-[1.5rem] p-5"
      >
        <h2 className="display text-2xl font-semibold">
          {editingId ? "Edit product" : "Add product"}
        </h2>
        <div className="mt-4 grid gap-3">
          <input
            className="field"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="field"
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Barcode"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="field"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ProductCategory,
                })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="field"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              className="field"
              type="number"
              placeholder="Cost"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              required
            />
            <input
              className="field"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <input
            className="field"
            placeholder="Sizes (comma separated)"
            value={form.sizes}
            onChange={(e) => setForm({ ...form, sizes: e.target.value })}
          />
          <input
            className="field"
            placeholder="Colors (comma separated)"
            value={form.colors}
            onChange={(e) => setForm({ ...form, colors: e.target.value })}
          />
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          {editingId ? (
            <button
              type="button"
              className="btn btn-ghost flex-1 rounded-2xl py-3"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary flex-1 rounded-2xl py-3 font-semibold"
          >
            {pending ? "Saving…" : editingId ? "Update" : "Add product"}
          </button>
        </div>
      </form>

      <section className="panel anim-rise anim-delay-1 rounded-[1.5rem] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="display text-2xl font-semibold">Inventory</h2>
          <input
            className="field sm:max-w-xs"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto">
          {visible.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-3"
            >
              <ProductSwatch
                name={product.name}
                hue={product.imageHue}
                className="h-16 w-16 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-[var(--ink-soft)]/70">
                      {product.sku} · {CATEGORY_LABELS[product.category]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--leaf)]">
                      {formatBdt(product.price, currency)}
                    </div>
                    <div
                      className={`text-xs ${
                        product.stock <= product.lowStockAt
                          ? "text-[var(--warn)]"
                          : "text-[var(--ink-soft)]/70"
                      }`}
                    >
                      Stock {product.stock}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost rounded-full px-3 py-1 text-xs"
                    onClick={() => startEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost rounded-full px-3 py-1 text-xs text-[var(--danger)]"
                    onClick={() => archive(product.id)}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
