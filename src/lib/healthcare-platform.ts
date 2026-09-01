import { access, mkdir, readFile, writeFile } from "fs/promises";
import {
  bookingTimesForDay,
  canBookDate,
  nextSerialNumber,
} from "@/lib/healthcare-slots";
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
  maxPatients: number;
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
  slotStart: string;
  slotEnd: string;
  serialNumber: string;
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

const SEED_FILE = path.join(process.cwd(), "src", "data", "healthcare-platform.json");

function dataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data");
}

function dataFilePath(): string {
  return path.join(dataDir(), "healthcare-platform.json");
}

function emptyData(): HealthcarePlatformData {
  return { companies: [], doctors: [], appointments: [] };
}

function normalizeAppointment(raw: Partial<HealthcareAppointment>): HealthcareAppointment {
  return {
    id: String(raw.id || ""),
    companyId: String(raw.companyId || ""),
    doctorId: String(raw.doctorId || ""),
    dghsId: String(raw.dghsId || ""),
    patientName: String(raw.patientName || ""),
    patientPhone: String(raw.patientPhone || ""),
    scheduledAt: String(raw.scheduledAt || ""),
    slotStart: String(raw.slotStart || raw.scheduledAt || ""),
    slotEnd: String(raw.slotEnd || ""),
    serialNumber: String(raw.serialNumber || ""),
    status: raw.status || "pending",
    source: raw.source || "online",
    notes: String(raw.notes || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

function normalizeData(raw: Partial<HealthcarePlatformData> | null | undefined): HealthcarePlatformData {
  if (!raw) return emptyData();
  return {
    companies: Array.isArray(raw.companies) ? raw.companies : [],
    doctors: Array.isArray(raw.doctors) ? raw.doctors : [],
    appointments: Array.isArray(raw.appointments)
      ? raw.appointments.map((a) => normalizeAppointment(a as Partial<HealthcareAppointment>))
      : [],
  };
}

async function ensureDataDir() {
  const dir = dataDir();
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

export async function loadHealthcarePlatform(): Promise<HealthcarePlatformData> {
  await ensureDataDir();
  const file = dataFilePath();
  try {
    const raw = await readFile(file, "utf8");
    return normalizeData(JSON.parse(raw) as HealthcarePlatformData);
  } catch {
    try {
      const seed = await readFile(SEED_FILE, "utf8");
      const parsed = normalizeData(JSON.parse(seed) as HealthcarePlatformData);
      await saveHealthcarePlatform(parsed);
      return parsed;
    } catch {
      const fresh = emptyData();
      await saveHealthcarePlatform(fresh);
      return fresh;
    }
  }
}

export async function saveHealthcarePlatform(data: HealthcarePlatformData): Promise<void> {
  await ensureDataDir();
  await writeFile(dataFilePath(), JSON.stringify(normalizeData(data), null, 2), "utf8");
}

export function newHealthcareToken(): string {
  return randomBytes(18).toString("base64url");
}

export function newHealthcareId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function findCompanyByLinkToken(
  data: HealthcarePlatformData,
  token: string,
): HealthcareCompany | null {
  const clean = token.trim();
  if (!clean) return null;
  return data.companies.find((c) => c.linkToken === clean && c.enabled) ?? null;
}

export function findCompanyById(
  data: HealthcarePlatformData,
  companyId: string,
): HealthcareCompany | null {
  return data.companies.find((c) => c.id === companyId) ?? null;
}

export function doctorVisibleAtFacility(
  data: HealthcarePlatformData,
  doctor: HealthcareDoctor,
  facilityDghsId: string,
): boolean {
  if (!doctor.enabled) return false;
  const company = findCompanyById(data, doctor.companyId);
  if (!company?.enabled) return false;

  if (doctor.dghsId === facilityDghsId) return true;

  if (company.linkedDghsIds.includes(facilityDghsId)) {
    return !doctor.dghsId || doctor.dghsId === facilityDghsId;
  }

  return false;
}

export function doctorsForFacility(
  data: HealthcarePlatformData,
  dghsId: string,
): HealthcareDoctor[] {
  return data.doctors.filter((d) => doctorVisibleAtFacility(data, d, dghsId));
}

export function doctorsForPublicCompany(
  data: HealthcarePlatformData,
  companyId: string,
): HealthcareDoctor[] {
  const company = findCompanyById(data, companyId);
  if (!company?.enabled) return [];
  return data.doctors.filter((d) => d.companyId === companyId && d.enabled);
}

function normSearch(s: string) {
  return s.trim().toLowerCase();
}

export function searchPublicHealthcareCompanies(
  data: HealthcarePlatformData,
  params: { q?: string; district?: string; upazila?: string },
): HealthcareCompany[] {
  const q = normSearch(params.q ?? "");
  const district = normSearch(params.district ?? "");
  const upazila = normSearch(params.upazila ?? "");

  return data.companies.filter((company) => {
    if (!company.enabled) return false;
    const hasDoctors = data.doctors.some((d) => d.companyId === company.id && d.enabled);
    if (!hasDoctors) return false;
    if (district && normSearch(company.district) !== district) return false;
    if (upazila && normSearch(company.upazila) !== upazila) return false;
    if (!q) return true;
    const hay = [company.name, company.nameBn, company.contactPhone, company.district, company.upazila]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function doctorsForCompany(
  data: HealthcarePlatformData,
  companyId: string,
): HealthcareDoctor[] {
  return data.doctors.filter((d) => d.companyId === companyId);
}

export function appointmentsForCompany(
  data: HealthcarePlatformData,
  companyId: string,
): HealthcareAppointment[] {
  return data.appointments
    .filter((a) => a.companyId === companyId)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

export async function createHealthcareCompany(input: {
  name: string;
  nameBn?: string;
  contactPhone?: string;
  contactEmail?: string;
  district?: string;
  upazila?: string;
  linkedDghsIds?: string[];
}): Promise<HealthcareCompany> {
  const data = await loadHealthcarePlatform();
  const now = new Date().toISOString();
  const company: HealthcareCompany = {
    id: newHealthcareId("hco"),
    name: input.name.trim(),
    nameBn: String(input.nameBn || "").trim(),
    contactPhone: String(input.contactPhone || "").trim(),
    contactEmail: String(input.contactEmail || "").trim(),
    linkToken: newHealthcareToken(),
    enabled: true,
    linkedDghsIds: Array.isArray(input.linkedDghsIds)
      ? [...new Set(input.linkedDghsIds.map((id) => String(id).trim()).filter(Boolean))]
      : [],
    district: String(input.district || "").trim(),
    upazila: String(input.upazila || "").trim(),
    createdAt: now,
    updatedAt: now,
  };
  data.companies.push(company);
  await saveHealthcarePlatform(data);
  return company;
}

export async function updateHealthcareCompany(
  companyId: string,
  patch: Partial<
    Pick<
      HealthcareCompany,
      | "name"
      | "nameBn"
      | "contactPhone"
      | "contactEmail"
      | "enabled"
      | "linkedDghsIds"
      | "district"
      | "upazila"
    >
  >,
): Promise<HealthcareCompany | null> {
  const data = await loadHealthcarePlatform();
  const idx = data.companies.findIndex((c) => c.id === companyId);
  if (idx === -1) return null;
  const current = data.companies[idx]!;
  const next: HealthcareCompany = {
    ...current,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    nameBn: patch.nameBn !== undefined ? patch.nameBn.trim() : current.nameBn,
    contactPhone:
      patch.contactPhone !== undefined ? patch.contactPhone.trim() : current.contactPhone,
    contactEmail:
      patch.contactEmail !== undefined ? patch.contactEmail.trim() : current.contactEmail,
    linkedDghsIds:
      patch.linkedDghsIds !== undefined
        ? [...new Set(patch.linkedDghsIds.map((id) => String(id).trim()).filter(Boolean))]
        : current.linkedDghsIds,
    district: patch.district !== undefined ? patch.district.trim() : current.district,
    upazila: patch.upazila !== undefined ? patch.upazila.trim() : current.upazila,
    updatedAt: new Date().toISOString(),
  };
  data.companies[idx] = next;
  await saveHealthcarePlatform(data);
  return next;
}

export async function deleteHealthcareCompany(companyId: string): Promise<boolean> {
  const data = await loadHealthcarePlatform();
  const before = data.companies.length;
  data.companies = data.companies.filter((c) => c.id !== companyId);
  data.doctors = data.doctors.filter((d) => d.companyId !== companyId);
  data.appointments = data.appointments.filter((a) => a.companyId !== companyId);
  if (data.companies.length === before) return false;
  await saveHealthcarePlatform(data);
  return true;
}

export async function regenerateHealthcareCompanyToken(
  companyId: string,
): Promise<HealthcareCompany | null> {
  const data = await loadHealthcarePlatform();
  const idx = data.companies.findIndex((c) => c.id === companyId);
  if (idx === -1) return null;
  data.companies[idx] = {
    ...data.companies[idx]!,
    linkToken: newHealthcareToken(),
    updatedAt: new Date().toISOString(),
  };
  await saveHealthcarePlatform(data);
  return data.companies[idx]!;
}

export async function createHealthcareDoctor(input: {
  companyId: string;
  dghsId: string;
  name: string;
  nameBn?: string;
  specialty?: string;
  specialtyBn?: string;
  phone?: string;
  room?: string;
  schedules?: HealthcareDoctorSchedule[];
}): Promise<HealthcareDoctor | null> {
  const data = await loadHealthcarePlatform();
  const company = findCompanyById(data, input.companyId);
  if (!company) return null;
  const dghsId = input.dghsId.trim() || company.linkedDghsIds[0] || "";
  if (
    dghsId &&
    company.linkedDghsIds.length > 0 &&
    !company.linkedDghsIds.includes(dghsId)
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const doctor: HealthcareDoctor = {
    id: newHealthcareId("hcd"),
    companyId: input.companyId,
    dghsId,
    name: input.name.trim(),
    nameBn: String(input.nameBn || "").trim(),
    specialty: String(input.specialty || "").trim(),
    specialtyBn: String(input.specialtyBn || "").trim(),
    phone: String(input.phone || "").trim(),
    room: String(input.room || "").trim(),
    enabled: true,
    schedules: Array.isArray(input.schedules) ? input.schedules : [],
    createdAt: now,
    updatedAt: now,
  };
  data.doctors.push(doctor);
  await saveHealthcarePlatform(data);
  return doctor;
}

export async function updateHealthcareDoctor(
  doctorId: string,
  companyId: string,
  patch: Partial<
    Pick<
      HealthcareDoctor,
      | "name"
      | "nameBn"
      | "specialty"
      | "specialtyBn"
      | "phone"
      | "room"
      | "enabled"
      | "schedules"
      | "dghsId"
    >
  >,
): Promise<HealthcareDoctor | null> {
  const data = await loadHealthcarePlatform();
  const idx = data.doctors.findIndex((d) => d.id === doctorId && d.companyId === companyId);
  if (idx === -1) return null;
  const current = data.doctors[idx]!;
  if (patch.dghsId !== undefined) {
    const company = findCompanyById(data, companyId);
    const nextDghsId = patch.dghsId.trim() || company?.linkedDghsIds[0] || "";
    if (
      nextDghsId &&
      company?.linkedDghsIds.length &&
      !company.linkedDghsIds.includes(nextDghsId)
    ) {
      return null;
    }
    patch = { ...patch, dghsId: nextDghsId };
  }
  const next: HealthcareDoctor = {
    ...current,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    nameBn: patch.nameBn !== undefined ? patch.nameBn.trim() : current.nameBn,
    specialty: patch.specialty !== undefined ? patch.specialty.trim() : current.specialty,
    specialtyBn:
      patch.specialtyBn !== undefined ? patch.specialtyBn.trim() : current.specialtyBn,
    phone: patch.phone !== undefined ? patch.phone.trim() : current.phone,
    room: patch.room !== undefined ? patch.room.trim() : current.room,
    updatedAt: new Date().toISOString(),
  };
  data.doctors[idx] = next;
  await saveHealthcarePlatform(data);
  return next;
}

export async function deleteHealthcareDoctor(
  doctorId: string,
  companyId: string,
): Promise<boolean> {
  const data = await loadHealthcarePlatform();
  const before = data.doctors.length;
  data.doctors = data.doctors.filter((d) => !(d.id === doctorId && d.companyId === companyId));
  if (data.doctors.length === before) return false;
  await saveHealthcarePlatform(data);
  return true;
}

export async function createHealthcareAppointment(input: {
  companyId: string;
  doctorId: string;
  dghsId: string;
  patientName: string;
  patientPhone: string;
  scheduledAt?: string;
  date?: string;
  slotStart?: string;
  notes?: string;
  source?: HealthcareAppointment["source"];
  autoConfirm?: boolean;
}): Promise<HealthcareAppointment | null> {
  const data = await loadHealthcarePlatform();
  const doctor = data.doctors.find((d) => d.id === input.doctorId && d.enabled);
  if (!doctor) return null;

  const dateStr = (input.date || input.slotStart || input.scheduledAt || "").slice(0, 10);
  if (!dateStr || dateStr.length < 10) return null;

  if (!canBookDate(doctor, dateStr, data.appointments)) return null;

  const { slotStart, slotEnd } = bookingTimesForDay(doctor, dateStr);
  const serialNumber = nextSerialNumber(input.doctorId, dateStr, data.appointments);

  const appointment: HealthcareAppointment = {
    id: newHealthcareId("hca"),
    companyId: input.companyId,
    doctorId: input.doctorId,
    dghsId: input.dghsId,
    patientName: input.patientName.trim(),
    patientPhone: input.patientPhone.trim(),
    scheduledAt: slotStart,
    slotStart,
    slotEnd,
    serialNumber,
    status: input.autoConfirm !== false ? "confirmed" : "pending",
    source: input.source ?? "online",
    notes: String(input.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };
  data.appointments.push(appointment);
  await saveHealthcarePlatform(data);
  return appointment;
}

export async function updateHealthcareAppointment(
  appointmentId: string,
  companyId: string,
  patch: Partial<
    Pick<HealthcareAppointment, "status" | "scheduledAt" | "slotStart" | "slotEnd" | "notes">
  > & { date?: string },
): Promise<HealthcareAppointment | null> {
  const data = await loadHealthcarePlatform();
  const idx = data.appointments.findIndex(
    (a) => a.id === appointmentId && a.companyId === companyId,
  );
  if (idx === -1) return null;
  const current = data.appointments[idx]!;
  const doctor = data.doctors.find((d) => d.id === current.doctorId);
  const nextSlot = patch.slotStart ?? patch.scheduledAt;
  const nextDate = (patch.date || nextSlot || "").slice(0, 10);
  const currentDate = (current.slotStart || current.scheduledAt).slice(0, 10);
  const isReschedule = Boolean(nextDate && nextDate.length === 10 && nextDate !== currentDate);

  if (isReschedule && doctor) {
    const others = data.appointments.filter((a) => a.id !== appointmentId);
    if (!canBookDate(doctor, nextDate, others)) return null;
    const times = bookingTimesForDay(doctor, nextDate);
    const serialNumber = nextSerialNumber(current.doctorId, nextDate, others);
    data.appointments[idx] = {
      ...current,
      ...patch,
      scheduledAt: times.slotStart,
      slotStart: times.slotStart,
      slotEnd: times.slotEnd,
      serialNumber,
      status: patch.status ?? current.status,
    };
  } else {
    data.appointments[idx] = {
      ...current,
      ...patch,
      scheduledAt: nextSlot ?? current.scheduledAt,
      slotStart: nextSlot ?? current.slotStart,
    };
  }

  await saveHealthcarePlatform(data);
  return data.appointments[idx]!;
}
