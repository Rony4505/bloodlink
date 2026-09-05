import { getHealthcareFacilityBySlugOrId } from "@/lib/healthcare-facilities";
import {
  doctorsForFacility,
  loadHealthcarePlatform,
} from "@/lib/healthcare-platform";

type Params = { params: Promise<{ dghsId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { dghsId } = await params;
  const facility = await getHealthcareFacilityBySlugOrId(dghsId);
  if (!facility) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const platform = await loadHealthcarePlatform();
  // Public visitors may only open facilities linked to an enabled registered company.
  const registered = platform.companies.some(
    (c) =>
      c.enabled &&
      (c.linkedDghsIds.includes(facility.dghsId) ||
        platform.doctors.some(
          (d) =>
            d.companyId === c.id &&
            d.enabled &&
            d.dghsId === facility.dghsId,
        )),
  );
  if (!registered) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const doctors = doctorsForFacility(platform, facility.dghsId).map((d) => ({
    id: d.id,
    name: d.name,
    nameBn: d.nameBn,
    specialty: d.specialty,
    specialtyBn: d.specialtyBn,
    phone: d.phone,
    room: d.room,
    schedules: d.schedules,
  }));
  return Response.json({ facility, doctors });
}
