import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { searchHealthcareFacilities } from "@/lib/healthcare-facilities";

export async function GET(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const category =
    categoryParam === "hospital" || categoryParam === "diagnostic"
      ? categoryParam
      : "all";

  try {
    const result = await searchHealthcareFacilities({
      q: searchParams.get("q") ?? undefined,
      district: searchParams.get("district") ?? undefined,
      division: searchParams.get("division") ?? undefined,
      category,
      page: Number(searchParams.get("page") ?? "1") || 1,
      limit: Number(searchParams.get("limit") ?? "50") || 50,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load healthcare data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
