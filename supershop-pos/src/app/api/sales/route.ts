import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { invoiceNo, uid } from "@/lib/id";
import { roundMoney } from "@/lib/money";
import { readStore, updateStore } from "@/lib/store";
import type { CartLine, Sale } from "@/lib/types";

const checkoutSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
        size: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .min(1),
  discount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "card", "bkash", "nagad"]),
  cashReceived: z.number().nonnegative().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await readStore();
  return NextResponse.json({ sales: store.sales });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout" }, { status: 400 });
  }

  try {
    const store = await updateStore((data) => {
      const lines: CartLine[] = [];
      for (const line of parsed.data.lines) {
        const product = data.products.find((p) => p.id === line.productId && p.active);
        if (!product) throw new Error(`MISSING:${line.productId}`);
        if (product.stock < line.qty) throw new Error(`STOCK:${product.name}`);
        product.stock -= line.qty;
        product.updatedAt = new Date().toISOString();
        lines.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          qty: line.qty,
          size: line.size,
          color: line.color,
        });
      }

      const subtotal = roundMoney(
        lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
      );
      const discount = Math.min(parsed.data.discount, subtotal);
      const total = roundMoney(subtotal - discount);

      if (
        parsed.data.paymentMethod === "cash" &&
        parsed.data.cashReceived != null &&
        parsed.data.cashReceived < total
      ) {
        throw new Error("CASH_SHORT");
      }

      const sale: Sale = {
        id: uid("sale"),
        invoiceNo: invoiceNo(data.sales.length + 1),
        lines,
        subtotal,
        discount,
        total,
        paymentMethod: parsed.data.paymentMethod,
        cashReceived: parsed.data.cashReceived,
        createdAt: new Date().toISOString(),
        cashier: session.cashier,
      };
      data.sales.unshift(sale);
      return data;
    });

    return NextResponse.json({ sale: store.sales[0] }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("STOCK:")) {
      return NextResponse.json(
        { error: `Not enough stock for ${message.slice(6)}` },
        { status: 409 },
      );
    }
    if (message.startsWith("MISSING:")) {
      return NextResponse.json({ error: "Product missing" }, { status: 404 });
    }
    if (message === "CASH_SHORT") {
      return NextResponse.json({ error: "Cash received is short" }, { status: 400 });
    }
    throw err;
  }
}
