import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { exportFashionStoreBackup } from "@/lib/fashion/store";

export async function GET() {
  if (!(await isFashionAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await exportFashionStoreBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(store, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="smartcraft-backup-${stamp}.json"`,
    },
  });
}
