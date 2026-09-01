import { createHealthcareAppointment, loadHealthcarePlatform } from "@/lib/healthcare-platform";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const doctorId = String(body.doctorId || "").trim();
    const dghsId = String(body.dghsId || "").trim();
    const patientName = String(body.patientName || "").trim();
    const patientPhone = String(body.patientPhone || "").trim();
    const scheduledAt = String(body.scheduledAt || "").trim();
    const notes = String(body.notes || "").trim();

    if (!doctorId || !dghsId || !patientName || !patientPhone || !scheduledAt) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const platform = await loadHealthcarePlatform();
    const doctor = platform.doctors.find((d) => d.id === doctorId && d.enabled);
    if (!doctor || doctor.dghsId !== dghsId) {
      return Response.json({ error: "Doctor not found" }, { status: 404 });
    }

    const appointment = await createHealthcareAppointment({
      companyId: doctor.companyId,
      doctorId,
      dghsId,
      patientName,
      patientPhone,
      scheduledAt,
      notes,
    });

    return Response.json({ ok: true, appointment });
  } catch {
    return Response.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
