import { NextResponse } from "next/server";
import { getCurrentCustomer, isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { calculateDeliveryFee } from "@/lib/fashion/delivery";
import { getOrderById, updateOrderStatus } from "@/lib/fashion/store";
import type { OrderStatus } from "@/lib/fashion/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const admin = await isFashionAdminAuthenticated();
  const customer = await getCurrentCustomer();

  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!admin && order.customerId !== customer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const status = body.status as OrderStatus;
  const message = String(body.message ?? "অর্ডার আপডেট করা হয়েছে");

  const order = await updateOrderStatus(id, status, message);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
