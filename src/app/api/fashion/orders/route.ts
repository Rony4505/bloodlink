import { NextResponse } from "next/server";
import { getCurrentCustomer, isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { calculateDeliveryFee } from "@/lib/fashion/delivery";
import { createOrder, getProductById, getStoreSettings, getVipDiscountPreview, listOrders, listOrdersForCustomer, validateCoupon } from "@/lib/fashion/store";
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

  if (!form?.name || !form.phone || !form.address || !form.district?.trim() || !items?.length) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || product.stock < item.quantity) {
      return NextResponse.json(
        { error: `${item.name} স্টকে পর্যাপ্ত নেই` },
        { status: 400 },
      );
    }
  }

  const settings = await getStoreSettings();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const customer = await getCurrentCustomer();

  let discount = 0;
  let couponCode: string | undefined;
  if (form.couponCode?.trim()) {
    const coupon = await validateCoupon(form.couponCode, subtotal);
    if (coupon) {
      discount =
        coupon.discountType === "percent"
          ? Math.round(subtotal * (coupon.discountValue / 100))
          : coupon.discountValue;
      couponCode = coupon.code;
    }
  }

  const vip = await getVipDiscountPreview({
    customerId: customer?.id,
    subtotal,
  });
  if (vip.eligible) {
    discount += vip.amount;
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const shipping = calculateDeliveryFee(settings, form.district, subtotalAfterDiscount);
  const total = subtotalAfterDiscount + shipping;

  const orderItems = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        buyPrice: product?.buyPrice ?? Math.round(item.price / 1.35),
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      };
    }),
  );

  const costTotal = orderItems.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);

  const order = await createOrder({
    customerId: customer?.id,
    customerName: form.name,
    phone: form.phone,
    email: form.email || undefined,
    address: form.address,
    district: form.district,
    note: form.note || undefined,
    paymentMethod: form.paymentMethod,
    items: orderItems,
    subtotal,
    discount,
    couponCode,
    shipping,
    total,
    costTotal,
  });

  return NextResponse.json({ order });
}
