import { searchHealthcareFacilities } from "@/lib/healthcare-facilities";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await searchHealthcareFacilities({
    q: searchParams.get("q") || undefined,
    district: searchParams.get("district") || undefined,
    division: searchParams.get("division") || undefined,
    upazila: searchParams.get("upazila") || undefined,
    category:
      (searchParams.get("category") as "all" | "hospital" | "diagnostic") || "all",
    page: Number(searchParams.get("page") || "1"),
    limit: Number(searchParams.get("limit") || "30"),
  });
  return Response.json(result);
}
