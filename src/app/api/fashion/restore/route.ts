import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { restoreFashionStoreFromBackup } from "@/lib/fashion/store";
import type { FashionStore } from "@/lib/fashion/types";

export async function POST(request: Request) {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<FashionStore>;
    const result = await restoreFashionStoreFromBackup(body);
    return NextResponse.json({
      ok: true,
      productCount: result.productCount,
      orderCount: result.orderCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
