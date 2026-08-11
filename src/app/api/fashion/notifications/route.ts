import { NextResponse } from "next/server";
import { getCurrentCustomer, isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import {
  listAdminNotifications,
  listUserNotifications,
  markAdminNotificationRead,
  markNotificationRead,
} from "@/lib/fashion/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "admin") {
    if (!(await isFashionAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const notifications = await listAdminNotifications();
    return NextResponse.json({ notifications });
  }

  const customer = await getCurrentCustomer();
  const notifications = await listUserNotifications();
  const filtered = customer
    ? notifications.filter((n) => !n.customerId || n.customerId === customer.id)
    : notifications.filter((n) => !n.customerId);
  return NextResponse.json({ notifications: filtered });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, scope } = body;

  if (scope === "admin") {
    if (!(await isFashionAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await markAdminNotificationRead(id);
    return NextResponse.json({ ok: true });
  }

  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markNotificationRead(id, customer.id);
  return NextResponse.json({ ok: true });
}
