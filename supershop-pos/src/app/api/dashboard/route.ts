import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

function isSameDay(iso: string, now = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await readStore();
  const todaySales = store.sales.filter((s) => isSameDay(s.createdAt));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayOrders = todaySales.length;
  const itemsSold = todaySales.reduce(
    (sum, s) => sum + s.lines.reduce((n, l) => n + l.qty, 0),
    0,
  );
  const lowStock = store.products
    .filter((p) => p.active && p.stock <= p.lowStockAt)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  const productQty = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const sale of todaySales) {
    for (const line of sale.lines) {
      const prev = productQty.get(line.productId) || {
        name: line.name,
        qty: 0,
        revenue: 0,
      };
      prev.qty += line.qty;
      prev.revenue += line.qty * line.unitPrice;
      productQty.set(line.productId, prev);
    }
  }
  const topProducts = [...productQty.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return NextResponse.json({
    todayRevenue,
    todayOrders,
    itemsSold,
    productCount: store.products.filter((p) => p.active).length,
    lowStock,
    topProducts,
    recentSales: store.sales.slice(0, 6),
  });
}
