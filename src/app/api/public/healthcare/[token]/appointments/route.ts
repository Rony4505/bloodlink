import { NextResponse } from "next/server";
import {
  createHealthcareAppointment,
  findCompanyByLinkToken,
  loadHealthcarePlatform,
  updateHealthcareAppointment,
} from "@/lib/healthcare-platform";
import {
  sendAppointmentCancelledSms,
  sendAppointmentRescheduledSms,
} from "@/lib/healthcare-notify";

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
    const dghsId = String(body?.dghsId || company.linkedDghsIds[0] || "").trim();
    const patientName = String(body?.patientName || "").trim();
    const patientPhone = String(body?.patientPhone || "").trim();
    const slotStart = String(body?.slotStart || body.scheduledAt || "").trim();
    const date = String(body?.date || slotStart.slice(0, 10) || "").trim();

    if (!doctorId || !patientName || !patientPhone || !date) {
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
      date,
      notes: body?.notes,
      source: "phone",
      autoConfirm: true,
    });

    if (!appointment) {
      return NextResponse.json({ error: "Slot not available" }, { status: 409 });
    }

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
    const notifyPatient = Boolean(body?.notifyPatient);
    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    const existing = data.appointments.find(
      (a) => a.id === appointmentId && a.companyId === company.id,
    );
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const nextStatus = body?.status as typeof existing.status | undefined;
    const nextDate = body?.date ? String(body.date).slice(0, 10) : undefined;
    const nextSlot = body?.slotStart ? String(body.slotStart) : undefined;
    const isCancel = nextStatus === "cancelled";
    const existingDate = (existing.slotStart || existing.scheduledAt).slice(0, 10);
    const isReschedule = Boolean(
      (nextDate && nextDate !== existingDate) ||
        (nextSlot && nextSlot.slice(0, 10) !== existingDate),
    );

    if ((isCancel || isReschedule) && !notifyPatient) {
      return NextResponse.json(
        { error: "notifyPatient required before cancel or reschedule" },
        { status: 400 },
      );
    }

    const appointment = await updateHealthcareAppointment(appointmentId, company.id, {
      status: nextStatus,
      scheduledAt: nextSlot ?? body?.scheduledAt,
      slotStart: nextSlot,
      date: nextDate,
      notes: body?.notes,
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const doctor = data.doctors.find((d) => d.id === appointment.doctorId);
    const facilityName = company.nameBn || company.name;
    let sms = null;

    if (doctor && notifyPatient) {
      if (isCancel) {
        sms = await sendAppointmentCancelledSms({ appointment, doctor, facilityName });
      } else if (isReschedule) {
        sms = await sendAppointmentRescheduledSms({
          appointment,
          doctor,
          facilityName,
          previousWhen: existing.slotStart || existing.scheduledAt,
        });
      }
    }

    return NextResponse.json({ ok: true, appointment, sms });
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
