import { readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export type HealthcareDoctor = {
  id: string;
  companyId: string;
  dghsId: string;
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
  phone: string;
  room: string;
  enabled: boolean;
  schedules: HealthcareDoctorSchedule[];
  createdAt: string;
  updatedAt: string;
};

export type HealthcareDoctorSchedule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  notes: string;
};

export type HealthcareAppointment = {
  id: string;
  companyId: string;
  doctorId: string;
  dghsId: string;
  patientName: string;
  patientPhone: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  source: "online" | "phone";
  notes: string;
  createdAt: string;
};

export type HealthcareCompany = {
  id: string;
  name: string;
  nameBn: string;
  contactPhone: string;
  contactEmail: string;
  linkToken: string;
  enabled: boolean;
  linkedDghsIds: string[];
  district: string;
  upazila: string;
  createdAt: string;
  updatedAt: string;
};

export type HealthcarePlatformData = {
  companies: HealthcareCompany[];
  doctors: HealthcareDoctor[];
  appointments: HealthcareAppointment[];
};

const DATA_FILE = path.join(process.cwd(), "src", "data", "healthcare-platform.json");

function emptyData(): HealthcarePlatformData {
  return { companies: [], doctors: [], appointments: [] };
}

export async function loadHealthcarePlatform(): Promise<HealthcarePlatformData> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as HealthcarePlatformData;
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
    };
  } catch {
    return emptyData();
  }
}

export async function saveHealthcarePlatform(data: HealthcarePlatformData): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function newHealthcareToken(): string {
  return randomBytes(16).toString("hex");
}

export function doctorsForFacility(
  data: HealthcarePlatformData,
  dghsId: string,
): HealthcareDoctor[] {
  return data.doctors.filter((d) => d.dghsId === dghsId && d.enabled);
}

export async function createHealthcareAppointment(input: {
  companyId: string;
  doctorId: string;
  dghsId: string;
  patientName: string;
  patientPhone: string;
  scheduledAt: string;
  notes?: string;
}): Promise<HealthcareAppointment> {
  const data = await loadHealthcarePlatform();
  const appointment: HealthcareAppointment = {
    id: `hca_${randomBytes(8).toString("hex")}`,
    companyId: input.companyId,
    doctorId: input.doctorId,
    dghsId: input.dghsId,
    patientName: input.patientName.trim(),
    patientPhone: input.patientPhone.trim(),
    scheduledAt: input.scheduledAt,
    status: "pending",
    source: "online",
    notes: String(input.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };
  data.appointments.push(appointment);
  await saveHealthcarePlatform(data);
  return appointment;
}
