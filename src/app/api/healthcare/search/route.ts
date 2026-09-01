import { searchHealthcareFacilities } from "@/lib/healthcare-facilities";
import { loadHealthcarePlatform, searchPublicHealthcareCompanies } from "@/lib/healthcare-platform";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const district = searchParams.get("district") || undefined;
  const upazila = searchParams.get("upazila") || undefined;

  const result = await searchHealthcareFacilities({
    q,
    district,
    division: searchParams.get("division") || undefined,
    upazila,
    category:
      (searchParams.get("category") as "all" | "hospital" | "diagnostic") || "all",
    page: Number(searchParams.get("page") || "1"),
    limit: Number(searchParams.get("limit") || "30"),
  });

  const platform = await loadHealthcarePlatform();
  const companies = searchPublicHealthcareCompanies(platform, { q, district, upazila }).map(
    (c) => ({
      id: c.id,
      name: c.name,
      nameBn: c.nameBn,
      contactPhone: c.contactPhone,
      district: c.district,
      upazila: c.upazila,
      doctorCount: platform.doctors.filter((d) => d.companyId === c.id && d.enabled).length,
    }),
  );

  return Response.json({ ...result, companies });
}
