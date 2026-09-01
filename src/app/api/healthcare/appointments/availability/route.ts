import { NextResponse } from "next/server";
import {
  loadHealthcarePlatform,
  findCompanyById,
} from "@/lib/healthcare-platform";
import { getMonthAvailability } from "@/lib/healthcare-slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId")?.trim() || "";
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);

  if (!doctorId || !year || !month) {
    return NextResponse.json({ error: "doctorId, year, month required" }, { status: 400 });
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

  const days = getMonthAvailability(doctor, year, month, platform.appointments);

  return NextResponse.json({ year, month, doctorId, days });
}
