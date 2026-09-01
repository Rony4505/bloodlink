import { NextResponse } from "next/server";
import { getHealthcareFacilityById } from "@/lib/healthcare-facilities";
import {
  appointmentsForCompany,
  doctorsForCompany,
  findCompanyByLinkToken,
  loadHealthcarePlatform,
} from "@/lib/healthcare-platform";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const data = await loadHealthcarePlatform();
  const company = findCompanyByLinkToken(data, token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doctors = doctorsForCompany(data, company.id);
  const appointments = appointmentsForCompany(data, company.id);
  const facilities = await Promise.all(
    company.linkedDghsIds.map(async (dghsId) => {
      const facility = await getHealthcareFacilityById(dghsId);
      return facility
        ? {
            dghsId: facility.dghsId,
            name: facility.name,
            nameBn: facility.nameBn,
            district: facility.district,
            upazila: facility.upazila,
          }
        : { dghsId, name: dghsId, nameBn: "", district: "", upazila: "" };
    }),
  );

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      nameBn: company.nameBn,
      contactPhone: company.contactPhone,
      contactEmail: company.contactEmail,
      district: company.district,
      upazila: company.upazila,
      linkedDghsIds: company.linkedDghsIds,
    },
    facilities,
    doctors,
    appointments,
    stats: {
      doctors: doctors.length,
      appointments: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
    },
  });
}
