import { DISTRICTS } from "@/lib/districts";
import {
  loadHealthcarePlatform,
  searchPublicHealthcareCompanies,
} from "@/lib/healthcare-platform";

/**
 * Public healthcare search: only registered (enabled) providers.
 * Avoids loading the ~11MB DGHS catalog on every keystroke.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const district = searchParams.get("district") || undefined;
  const upazila = searchParams.get("upazila") || undefined;

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

  const enabled = platform.companies.filter((c) => c.enabled);
  const companyDistricts = [
    ...new Set(enabled.map((c) => c.district).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const districts =
    companyDistricts.length > 0 ? companyDistricts : [...DISTRICTS];

  const upazilaSource = district
    ? enabled.filter(
        (c) => c.district.trim().toLowerCase() === district.trim().toLowerCase(),
      )
    : enabled;
  const upazilas = [
    ...new Set(upazilaSource.map((c) => c.upazila).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return Response.json({
    items: [],
    companies,
    total: companies.length,
    page: 1,
    limit: companies.length || 1,
    totalPages: 1,
    districts,
    upazilas,
  });
}
