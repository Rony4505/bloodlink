import { facilityPublicSlug, searchHealthcareFacilities } from "@/lib/healthcare-facilities";
import {
  ensureHealthcareNameLinkTokens,
  loadHealthcarePlatform,
  searchPublicHealthcareCompanies,
} from "@/lib/healthcare-platform";

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

  await ensureHealthcareNameLinkTokens();
  const platform = await loadHealthcarePlatform();
  const companies = searchPublicHealthcareCompanies(platform, { q, district, upazila }).map(
    (c) => ({
      id: c.id,
      slug: c.linkToken,
      name: c.name,
      nameBn: c.nameBn,
      contactPhone: c.contactPhone,
      district: c.district,
      upazila: c.upazila,
      doctorCount: platform.doctors.filter((d) => d.companyId === c.id && d.enabled).length,
    }),
  );

  const items = result.items.map((f) => ({
    ...f,
    slug: facilityPublicSlug(f),
  }));

  return Response.json({ ...result, items, companies });
}
