import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { uid } from "@/lib/id";
import { readStore, updateStore } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(40),
  barcode: z.string().trim().max(64).optional(),
  category: z.enum(["men", "women", "kids", "accessories", "grocery", "other"]),
  brand: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  stock: z.number().int(),
  lowStockAt: z.number().int().nonnegative().optional(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  imageHue: z.number().min(0).max(360).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({ products: store.products });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const product: Product = {
    id: uid("prd"),
    name: parsed.data.name,
    sku: parsed.data.sku.toUpperCase(),
    barcode: parsed.data.barcode,
    category: parsed.data.category as ProductCategory,
    brand: parsed.data.brand,
    description: parsed.data.description,
    price: parsed.data.price,
    cost: parsed.data.cost,
    stock: parsed.data.stock,
    lowStockAt: parsed.data.lowStockAt ?? 5,
    sizes: parsed.data.sizes,
    colors: parsed.data.colors,
    imageHue: parsed.data.imageHue ?? Math.floor(Math.random() * 360),
    active: parsed.data.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const store = await updateStore((data) => {
      if (data.products.some((p) => p.sku === product.sku)) {
        throw new Error("SKU_EXISTS");
      }
      data.products.unshift(product);
      return data;
    });
    return NextResponse.json(
      { product: store.products.find((p) => p.id === product.id) },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SKU_EXISTS") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    throw err;
  }
}
