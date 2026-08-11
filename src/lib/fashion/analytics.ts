import type { AnalyticsSummary, FashionOrder } from "./types";

function inPeriod(date: string, period: "daily" | "monthly", ref = new Date()): boolean {
  const d = new Date(date);
  if (period === "daily") {
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate()
    );
  }
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function computeAnalytics(
  orders: FashionOrder[],
  period: "daily" | "monthly",
  ref = new Date(),
): AnalyticsSummary {
  const relevant = orders.filter((order) => inPeriod(order.createdAt, period, ref));
  const delivered = relevant.filter((o) => o.status !== "cancelled");
  const cancelled = relevant.filter((o) => o.status === "cancelled");

  const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
  const cost = delivered.reduce((sum, o) => sum + (o.costTotal ?? 0), 0);
  const deliveryFees = delivered.reduce((sum, o) => sum + o.shipping, 0);

  return {
    period,
    revenue,
    cost,
    profit: revenue - cost,
    deliveryFees,
    orderCount: delivered.length,
    cancelledCount: cancelled.length,
  };
}
