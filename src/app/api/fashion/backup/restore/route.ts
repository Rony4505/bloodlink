import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { restoreStoreFromBackup } from "@/lib/fashion/store";

export async function POST(request: Request) {
  const ok = await isFashionAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON backup" }, { status: 400 });
  }

  try {
    const result = await restoreStoreFromBackup(body);
    return NextResponse.json({
      ok: true,
      productCount: result.productCount,
      orderCount: result.orderCount,
      customerCount: result.customerCount,
      message: `Restored ${result.productCount} products, ${result.orderCount} orders, ${result.customerCount} customers`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Restore failed",
      },
      { status: 400 },
    );
  }
}
