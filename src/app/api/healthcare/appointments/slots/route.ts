import { NextResponse } from "next/server";
import {
  loadHealthcarePlatform,
  findCompanyById,
} from "@/lib/healthcare-platform";
import { getDayCapacity, getDayBookingInfo } from "@/lib/healthcare-slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId")?.trim() || "";
  const date = searchParams.get("date")?.slice(0, 10) || "";

  if (!doctorId || !date) {
    return NextResponse.json({ error: "doctorId and date required" }, { status: 400 });
  }

  const platform = await loadHealthcarePlatform();
  const doctor = platform.doctors.find((d) => d.id === doctorId && d.enabled);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  const company = findCompanyById(platform, doctor.companyId);
  if (!company?.enabled) {
    return NextResponse.json({ error: "Provider not available" }, { status: 404 });
  }

  const capacity = getDayCapacity(doctor, date, platform.appointments);
  const booking = getDayBookingInfo(doctor, date, platform.appointments);

  return NextResponse.json({ ...capacity, booking });
}
