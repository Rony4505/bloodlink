import { NextResponse } from "next/server";
import {
  createHealthcareDoctor,
  deleteHealthcareDoctor,
  findCompanyByLinkToken,
  loadHealthcarePlatform,
  newHealthcareId,
  updateHealthcareDoctor,
  type HealthcareDoctorSchedule,
} from "@/lib/healthcare-platform";

type RouteParams = { params: Promise<{ token: string }> };

function normalizeSchedules(raw: unknown): HealthcareDoctorSchedule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Partial<HealthcareDoctorSchedule>;
      return {
        id: String(row.id || newHealthcareId("sch")),
        weekday: Math.min(6, Math.max(0, Number(row.weekday) || 0)),
        startTime: String(row.startTime || "09:00").slice(0, 5),
        endTime: String(row.endTime || "17:00").slice(0, 5),
        slotMinutes: Math.max(5, Number(row.slotMinutes) || 15),
        notes: String(row.notes || "").trim(),
      };
    })
    .filter((s) => s.startTime && s.endTime);
}

async function resolveCompany(token: string) {
  const data = await loadHealthcarePlatform();
  const company = findCompanyByLinkToken(data, token);
  return { data, company };
}

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const { company } = await resolveCompany(token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const dghsId = String(body?.dghsId || company.linkedDghsIds[0] || "").trim();

    const doctor = await createHealthcareDoctor({
      companyId: company.id,
      dghsId,
      name,
      nameBn: body?.nameBn,
      specialty: body?.specialty,
      specialtyBn: body?.specialtyBn,
      phone: body?.phone,
      room: body?.room,
      schedules: normalizeSchedules(body?.schedules),
    });

    if (!doctor) {
      return NextResponse.json({ error: "Could not add doctor" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, doctor });
  } catch {
    return NextResponse.json({ error: "Failed to add doctor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const { company } = await resolveCompany(token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const doctorId = String(body?.doctorId || "").trim();
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId required" }, { status: 400 });
    }

    const doctor = await updateHealthcareDoctor(doctorId, company.id, {
      name: body?.name,
      nameBn: body?.nameBn,
      specialty: body?.specialty,
      specialtyBn: body?.specialtyBn,
      phone: body?.phone,
      room: body?.room,
      enabled: body?.enabled,
      dghsId: body?.dghsId,
      schedules: body?.schedules !== undefined ? normalizeSchedules(body.schedules) : undefined,
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, doctor });
  } catch {
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const { company } = await resolveCompany(token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId")?.trim() || "";
  if (!doctorId) {
    return NextResponse.json({ error: "doctorId required" }, { status: 400 });
  }

  const deleted = await deleteHealthcareDoctor(doctorId, company.id);
  if (!deleted) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
