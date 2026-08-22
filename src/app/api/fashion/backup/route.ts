import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { exportStoreSnapshot } from "@/lib/fashion/store";

export async function GET() {
  const ok = await isFashionAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await exportStoreSnapshot();
  const stamp = new Date().toISOString().slice(0, 10);
  const body = JSON.stringify(snapshot, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="smartcraft-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
