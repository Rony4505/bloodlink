import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { updateStore } from "@/lib/store";
import type { ProductCategory } from "@/lib/types";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sku: z.string().trim().min(1).max(40).optional(),
  barcode: z.string().trim().max(64).optional(),
  category: z
    .enum(["men", "women", "kids", "accessories", "grocery", "other"])
    .optional(),
  brand: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().optional(),
  lowStockAt: z.number().int().nonnegative().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  imageHue: z.number().min(0).max(360).optional(),
  active: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  try {
    const store = await updateStore((data) => {
      const idx = data.products.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error("NOT_FOUND");
      if (
        parsed.data.sku &&
        data.products.some((p) => p.sku === parsed.data.sku!.toUpperCase() && p.id !== id)
      ) {
        throw new Error("SKU_EXISTS");
      }
      data.products[idx] = {
        ...data.products[idx],
        ...parsed.data,
        sku: parsed.data.sku
          ? parsed.data.sku.toUpperCase()
          : data.products[idx].sku,
        category: (parsed.data.category as ProductCategory | undefined) ||
          data.products[idx].category,
        updatedAt: new Date().toISOString(),
      };
      return data;
    });
    const product = store.products.find((p) => p.id === id);
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (message === "SKU_EXISTS") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  try {
    await updateStore((data) => {
      const idx = data.products.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error("NOT_FOUND");
      data.products[idx] = {
        ...data.products[idx],
        active: false,
        updatedAt: new Date().toISOString(),
      };
      return data;
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
