import {
  createHealthcareAppointment,
  doctorVisibleAtFacility,
  loadHealthcarePlatform,
} from "@/lib/healthcare-platform";
import { sendAppointmentConfirmedSms } from "@/lib/healthcare-notify";
import { getHealthcareFacilityById } from "@/lib/healthcare-facilities";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const doctorId = String(body.doctorId || "").trim();
    const dghsId = String(body.dghsId || "").trim();
    const patientName = String(body.patientName || "").trim();
    const patientPhone = String(body.patientPhone || "").trim();
    const slotStart = String(body.slotStart || body.scheduledAt || "").trim();
    const date = String(body.date || slotStart.slice(0, 10) || "").trim();
    const notes = String(body.notes || "").trim();

    if (!doctorId || !patientName || !patientPhone || !date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const platform = await loadHealthcarePlatform();
    const doctor = platform.doctors.find((d) => d.id === doctorId && d.enabled);
    if (!doctor) {
      return Response.json({ error: "Doctor not found" }, { status: 404 });
    }

    const company = platform.companies.find((c) => c.id === doctor.companyId);
    const effectiveDghsId =
      dghsId || doctor.dghsId || company?.linkedDghsIds[0] || "";

    if (dghsId && !doctorVisibleAtFacility(platform, doctor, dghsId)) {
      return Response.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointment = await createHealthcareAppointment({
      companyId: doctor.companyId,
      doctorId,
      dghsId: effectiveDghsId,
      patientName,
      patientPhone,
      date,
      notes,
      autoConfirm: true,
    });

    if (!appointment) {
      return Response.json({ error: "Date full or not available" }, { status: 409 });
    }

    let facilityName = company?.nameBn || company?.name || "BloodLink";
    if (effectiveDghsId) {
      const facility = await getHealthcareFacilityById(effectiveDghsId);
      if (facility) facilityName = facility.nameBn || facility.name;
    }

    const sms = await sendAppointmentConfirmedSms({
      appointment,
      doctor,
      facilityName,
    });

    return Response.json({ ok: true, appointment, sms });
  } catch {
    return Response.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
