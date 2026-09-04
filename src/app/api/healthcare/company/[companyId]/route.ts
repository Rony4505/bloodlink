import {
  doctorsForPublicCompany,
  findCompanyByIdOrSlug,
  loadHealthcarePlatform,
} from "@/lib/healthcare-platform";

type Params = { params: Promise<{ companyId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { companyId } = await params;
  const platform = await loadHealthcarePlatform();
  const company = findCompanyByIdOrSlug(platform, companyId);
  if (!company || !company.enabled) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const doctors = doctorsForPublicCompany(platform, company.id).map((d) => ({
    id: d.id,
    name: d.name,
    nameBn: d.nameBn,
    specialty: d.specialty,
    specialtyBn: d.specialtyBn,
    phone: d.phone,
    room: d.room,
    schedules: d.schedules,
  }));

  return Response.json({
    company: {
      id: company.id,
      slug: company.linkToken,
      name: company.name,
      nameBn: company.nameBn,
      contactPhone: company.contactPhone,
      contactEmail: company.contactEmail,
      district: company.district,
      upazila: company.upazila,
      linkedDghsIds: company.linkedDghsIds,
    },
    doctors,
  });
}
