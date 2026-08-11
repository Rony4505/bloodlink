import { NextResponse } from "next/server";
import { getCurrentCustomer, isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { createOrder, listOrders, listOrdersForCustomer } from "@/lib/fashion/store";
import type { CartItem, CheckoutForm } from "@/lib/fashion/types";

export async function GET() {
  const admin = await isFashionAdminAuthenticated();
  if (admin) {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  }

  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await listOrdersForCustomer(customer.id);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const form = body.form as CheckoutForm;
  const items = body.items as CartItem[];

  if (!form?.name || !form.phone || !form.address || !items?.length) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 7000 ? 0 : 120;
  const total = subtotal + shipping;
  const customer = await getCurrentCustomer();

  const order = await createOrder({
    customerId: customer?.id,
    customerName: form.name,
    phone: form.phone,
    email: form.email || undefined,
    address: form.address,
    district: form.district,
    note: form.note || undefined,
    paymentMethod: form.paymentMethod,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
    subtotal,
    shipping,
    total,
  });

  return NextResponse.json({ order });
}
