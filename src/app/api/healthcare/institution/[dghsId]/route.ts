import { getHealthcareFacilityBySlugOrId } from "@/lib/healthcare-facilities";
import { doctorsForFacility, loadHealthcarePlatform } from "@/lib/healthcare-platform";

type Params = { params: Promise<{ dghsId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { dghsId } = await params;
  const facility = await getHealthcareFacilityBySlugOrId(dghsId);
  if (!facility) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const platform = await loadHealthcarePlatform();
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
