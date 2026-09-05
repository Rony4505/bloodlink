import { searchHealthcareFacilities } from "@/lib/healthcare-facilities";
import {
  ensureHealthcareNameLinkTokens,
  loadHealthcarePlatform,
  searchPublicHealthcareCompanies,
} from "@/lib/healthcare-platform";

/**
 * Public healthcare search: only registered (enabled) providers.
 * The full DGHS catalog stays admin-only — not listed on the public site.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const district = searchParams.get("district") || undefined;
  const upazila = searchParams.get("upazila") || undefined;

  // Keep facility index only for district/upazila filter options.
  const meta = await searchHealthcareFacilities({
    q: undefined,
    district,
    division: searchParams.get("division") || undefined,
    upazila: undefined,
    category: "all",
    page: 1,
    limit: 1,
  });

  await ensureHealthcareNameLinkTokens();
  const platform = await loadHealthcarePlatform();
  const companies = searchPublicHealthcareCompanies(platform, {
    q,
    district,
    upazila,
  }).map((c) => ({
    id: c.id,
    slug: c.linkToken,
    name: c.name,
    nameBn: c.nameBn,
    contactPhone: c.contactPhone,
    district: c.district,
    upazila: c.upazila,
    doctorCount: platform.doctors.filter(
      (d) => d.companyId === c.id && d.enabled,
    ).length,
  }));

  return Response.json({
    items: [],
    companies,
    total: companies.length,
    page: 1,
    limit: companies.length || 1,
    totalPages: 1,
    districts: meta.districts,
    upazilas: meta.upazilas,
  });
}
