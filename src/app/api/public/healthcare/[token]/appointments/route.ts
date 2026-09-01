import { NextResponse } from "next/server";
import {
  createHealthcareAppointment,
  findCompanyByLinkToken,
  loadHealthcarePlatform,
  updateHealthcareAppointment,
} from "@/lib/healthcare-platform";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const data = await loadHealthcarePlatform();
  const company = findCompanyByLinkToken(data, token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const doctorId = String(body?.doctorId || "").trim();
    const dghsId = String(body?.dghsId || "").trim();
    const patientName = String(body?.patientName || "").trim();
    const patientPhone = String(body?.patientPhone || "").trim();
    const scheduledAt = String(body?.scheduledAt || "").trim();

    if (!doctorId || !dghsId || !patientName || !patientPhone || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const doctor = data.doctors.find((d) => d.id === doctorId && d.companyId === company.id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointment = await createHealthcareAppointment({
      companyId: company.id,
      doctorId,
      dghsId,
      patientName,
      patientPhone,
      scheduledAt,
      notes: body?.notes,
      source: "phone",
    });

    return NextResponse.json({ ok: true, appointment });
  } catch {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const data = await loadHealthcarePlatform();
  const company = findCompanyByLinkToken(data, token);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const appointmentId = String(body?.appointmentId || "").trim();
    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    const appointment = await updateHealthcareAppointment(appointmentId, company.id, {
      status: body?.status,
      scheduledAt: body?.scheduledAt,
      notes: body?.notes,
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, appointment });
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
