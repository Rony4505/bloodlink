import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "fs/promises";
import {
  bookingTimesForDay,
  canBookDate,
  nextSerialNumber,
} from "@/lib/healthcare-slots";
import { getHealthcareFacilityById } from "@/lib/healthcare-facilities";
import {
  hasDatabaseUrl,
  loadHealthcareFromPostgres,
  saveHealthcareToPostgres,
} from "@/lib/pg-store";
import {
  looksLikeRandomPortalToken,
  uniqueSlug,
} from "@/lib/url-slug";
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
  source: "online" | "manual";
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

function dataBakPath(): string {
  return path.join(dataDir(), "healthcare-platform.bak.json");
}

function dataTmpPath(): string {
  return path.join(dataDir(), "healthcare-platform.tmp.json");
}

function dataBackupsDir(): string {
  return path.join(dataDir(), "healthcare-backups");
}

const MEMORY_TTL_MS = 5 * 60_000; // warm platform blob between admin/public hits
const MAX_ROTATING_BACKUPS = 30;

let writeQueue: Promise<void> = Promise.resolve();
let memoryHealthcare: HealthcarePlatformData | null = null;
let memoryHealthcareAt = 0;
let loadingHealthcare: Promise<HealthcarePlatformData> | null = null;
let loggedHealthcareStorage = false;
let lastHealthcareBackupAt = 0;

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
    source:
      String(raw.source || "") === "manual" || String(raw.source || "") === "phone"
        ? "manual"
        : "online",
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

function hasStoredData(data: HealthcarePlatformData): boolean {
  return data.companies.length > 0 || data.doctors.length > 0 || data.appointments.length > 0;
}

function dataScore(data: HealthcarePlatformData): number {
  return (
    data.companies.length * 10_000 + data.doctors.length * 100 + data.appointments.length
  );
}

function mergeHealthcareData(...sources: HealthcarePlatformData[]): HealthcarePlatformData {
  const companies = new Map<string, HealthcareCompany>();
  const doctors = new Map<string, HealthcareDoctor>();
  const appointments = new Map<string, HealthcareAppointment>();

  for (const src of sources) {
    for (const row of src.companies) {
      if (row.id) companies.set(row.id, row);
    }
    for (const row of src.doctors) {
      if (row.id) doctors.set(row.id, row);
    }
    for (const row of src.appointments) {
      if (row.id) appointments.set(row.id, row);
    }
  }

  return {
    companies: [...companies.values()],
    doctors: [...doctors.values()],
    appointments: [...appointments.values()],
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readHealthcareJsonFile(
  filePath: string,
): Promise<HealthcarePlatformData | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeData(JSON.parse(raw) as HealthcarePlatformData);
  } catch {
    return null;
  }
}

async function readHealthcareBackupFiles(): Promise<HealthcarePlatformData[]> {
  const dir = dataBackupsDir();
  try {
    const names = (await readdir(dir))
      .filter((name) => name.startsWith("healthcare-") && name.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 10);
    const results: HealthcarePlatformData[] = [];
    for (const name of names) {
      const parsed = await readHealthcareJsonFile(path.join(dir, name));
      if (parsed && hasStoredData(parsed)) results.push(parsed);
    }
    return results;
  } catch {
    return [];
  }
}

async function loadHealthcareFromStores(): Promise<HealthcarePlatformData> {
  if (!loggedHealthcareStorage) {
    loggedHealthcareStorage = true;
    console.info(
      `[healthcare] Storage backend: ${hasDatabaseUrl() ? "postgres+file" : "file"} (${dataFilePath()})`,
    );
  }

  await ensureDataDir();
  const fromFile = await readHealthcareJsonFile(dataFilePath());
  const fromBak = await readHealthcareJsonFile(dataBakPath());
  const fromBackups = await readHealthcareBackupFiles();

  let fromPg: HealthcarePlatformData | null = null;
  if (hasDatabaseUrl()) {
    try {
      const raw = await loadHealthcareFromPostgres();
      fromPg = raw ? normalizeData(raw as Partial<HealthcarePlatformData>) : null;
    } catch (err) {
      console.error("[healthcare] Postgres load failed:", err);
    }
  }

  const candidates = [fromPg, fromFile, fromBak, ...fromBackups].filter(
    (row): row is HealthcarePlatformData => Boolean(row && hasStoredData(row)),
  );

  if (!candidates.length) {
    const mainExists = await fileExists(dataFilePath());
    const bakExists = await fileExists(dataBakPath());
    if (mainExists || bakExists) {
      throw new Error(
        "[healthcare] Data files exist but could not be read — refusing empty wipe",
      );
    }
    return emptyData();
  }

  const merged = mergeHealthcareData(...candidates);
  const bestSingle = candidates.reduce((best, cur) =>
    dataScore(cur) > dataScore(best) ? cur : best,
  );
  const resolved = dataScore(merged) >= dataScore(bestSingle) ? merged : bestSingle;

  if (fromPg && dataScore(resolved) > dataScore(fromPg)) {
    console.warn(
      `[healthcare] Restored richer healthcare data into Postgres (${dataScore(resolved)} > ${dataScore(fromPg)})`,
    );
    await persistHealthcare(resolved, { allowShrink: true });
  } else if (!fromPg && hasDatabaseUrl() && hasStoredData(resolved)) {
    console.info("[healthcare] Migrating healthcare file data into Postgres");
    await persistHealthcare(resolved, { allowShrink: true });
  }

  return resolved;
}

async function writeRotatingHealthcareBackup(data: HealthcarePlatformData): Promise<void> {
  const now = Date.now();
  if (now - lastHealthcareBackupAt < 6 * 60 * 60 * 1000) return;
  lastHealthcareBackupAt = now;
  try {
    const dir = dataBackupsDir();
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(
      path.join(dir, `healthcare-${stamp}.json`),
      JSON.stringify(data, null, 2),
      "utf8",
    );
    const names = (await readdir(dir))
      .filter((name) => name.startsWith("healthcare-") && name.endsWith(".json"))
      .sort()
      .reverse();
    for (const name of names.slice(MAX_ROTATING_BACKUPS)) {
      await unlink(path.join(dir, name)).catch(() => undefined);
    }
  } catch (err) {
    console.error("[healthcare] rotating backup failed:", err);
  }
}

async function persistHealthcareToFile(
  data: HealthcarePlatformData,
  options: { allowShrink?: boolean } = {},
): Promise<void> {
  await ensureDataDir();
  const normalized = normalizeData(data);
  const existing = await readHealthcareJsonFile(dataFilePath());
  if (existing && !options.allowShrink) {
    if (hasStoredData(existing) && !hasStoredData(normalized)) {
      throw new Error("[healthcare] Refusing to overwrite file data with empty store");
    }
    if (existing.companies.length > 0 && normalized.companies.length === 0) {
      throw new Error("[healthcare] Refusing to wipe companies from file");
    }
    if (existing.doctors.length > 0 && normalized.doctors.length === 0) {
      throw new Error("[healthcare] Refusing to wipe doctors from file");
    }
  }

  if (await fileExists(dataFilePath())) {
    try {
      await copyFile(dataFilePath(), dataBakPath());
    } catch (err) {
      console.error("[healthcare] backup copy failed:", err);
    }
  }

  await writeFile(dataTmpPath(), JSON.stringify(normalized, null, 2), "utf8");
  await rename(dataTmpPath(), dataFilePath());
  await writeRotatingHealthcareBackup(normalized);
}

async function persistHealthcare(
  data: HealthcarePlatformData,
  options: { allowShrink?: boolean } = {},
): Promise<void> {
  const normalized = normalizeData(data);

  if (hasDatabaseUrl()) {
    try {
      await saveHealthcareToPostgres(normalized, options);
      try {
        await persistHealthcareToFile(normalized, options);
      } catch (err) {
        console.error("[healthcare] file mirror failed:", err);
      }
      memoryHealthcare = normalized;
      memoryHealthcareAt = Date.now();
      return;
    } catch (err) {
      console.error("[healthcare] Postgres persist failed — writing file fallback:", err);
    }
  }

  await persistHealthcareToFile(normalized, options);
  memoryHealthcare = normalized;
  memoryHealthcareAt = Date.now();
}

async function withHealthcareWrite<T>(
  fn: (data: HealthcarePlatformData) => Promise<T> | T,
  options: { allowShrink?: boolean } = {},
): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await loadHealthcareFromStores();
    const result = await fn(data);
    await persistHealthcare(data, options);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function loadHealthcarePlatform(): Promise<HealthcarePlatformData> {
  if (memoryHealthcare && Date.now() - memoryHealthcareAt < MEMORY_TTL_MS) {
    return memoryHealthcare;
  }
  if (loadingHealthcare) return loadingHealthcare;
  loadingHealthcare = loadHealthcareFromStores()
    .then((data) => {
      memoryHealthcare = data;
      memoryHealthcareAt = Date.now();
      return data;
    })
    .finally(() => {
      loadingHealthcare = null;
    });
  return loadingHealthcare;
}

export async function saveHealthcarePlatform(
  data: HealthcarePlatformData,
  options: { allowShrink?: boolean } = {},
): Promise<void> {
  const run = writeQueue.then(async () => {
    await persistHealthcare(normalizeData(data), options);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  await run;
}

export async function companyDefaultsFromDghs(linkedDghsIds: string[]): Promise<
  Partial<
    Pick<
      HealthcareCompany,
      "name" | "nameBn" | "contactPhone" | "contactEmail" | "district" | "upazila"
    >
  >
> {
  const primaryId = linkedDghsIds.find(Boolean);
  if (!primaryId) return {};
  const facility = await getHealthcareFacilityById(primaryId);
  if (!facility) return {};
  return {
    name: facility.name,
    nameBn: facility.nameBn,
    contactPhone: facility.phone,
    contactEmail: facility.email,
    district: facility.district,
    upazila: facility.upazila,
  };
}

export function newHealthcareToken(name: string, taken: Iterable<string>): string {
  return uniqueSlug(name || "hospital", taken);
}

export function newHealthcareId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function findCompanyByLinkToken(
  data: HealthcarePlatformData,
  token: string,
): HealthcareCompany | null {
  const clean = decodeURIComponent(token.trim());
  if (!clean) return null;
  return (
    data.companies.find((c) => c.linkToken === clean && c.enabled) ??
    data.companies.find(
      (c) =>
        c.enabled &&
        String(c.linkToken || "").toLowerCase() === clean.toLowerCase(),
    ) ??
    null
  );
}

export function findCompanyById(
  data: HealthcarePlatformData,
  companyId: string,
): HealthcareCompany | null {
  return data.companies.find((c) => c.id === companyId) ?? null;
}

/** Resolve public company by internal id OR name-based linkToken slug. */
export function findCompanyByIdOrSlug(
  data: HealthcarePlatformData,
  key: string,
): HealthcareCompany | null {
  const clean = key.trim();
  if (!clean) return null;
  return (
    findCompanyById(data, clean) ||
    data.companies.find((c) => c.linkToken === clean) ||
    null
  );
}

/** Rewrite old random hospital portal tokens to name-based slugs. */
export async function ensureHealthcareNameLinkTokens(): Promise<number> {
  const current = await loadHealthcarePlatform();
  if (
    !current.companies.some((c) => looksLikeRandomPortalToken(c.linkToken))
  ) {
    return 0;
  }
  return withHealthcareWrite(async (data) => {
    let changed = 0;
    const taken = new Set(
      data.companies
        .map((c) => String(c.linkToken || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const now = new Date().toISOString();
    for (let i = 0; i < data.companies.length; i++) {
      const company = data.companies[i]!;
      if (!looksLikeRandomPortalToken(company.linkToken)) continue;
      taken.delete(String(company.linkToken || "").toLowerCase());
      const next = newHealthcareToken(
        company.name || company.nameBn || "hospital",
        taken,
      );
      taken.add(next.toLowerCase());
      data.companies[i] = { ...company, linkToken: next, updatedAt: now };
      changed += 1;
    }
    return changed;
  });
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
  return withHealthcareWrite(async (data) => {
    const linkedDghsIds = Array.isArray(input.linkedDghsIds)
      ? [...new Set(input.linkedDghsIds.map((id) => String(id).trim()).filter(Boolean))]
      : [];
    const defaults = await companyDefaultsFromDghs(linkedDghsIds);
    const now = new Date().toISOString();
    const name = input.name.trim() || defaults.name || "";
    const taken = data.companies.map((c) => c.linkToken);
    const company: HealthcareCompany = {
      id: newHealthcareId("hco"),
      name,
      nameBn: String(input.nameBn || defaults.nameBn || "").trim(),
      contactPhone: String(input.contactPhone || defaults.contactPhone || "").trim(),
      contactEmail: String(input.contactEmail || defaults.contactEmail || "").trim(),
      linkToken: newHealthcareToken(name || String(input.nameBn || "hospital"), taken),
      enabled: true,
      linkedDghsIds,
      district: String(input.district || defaults.district || "").trim(),
      upazila: String(input.upazila || defaults.upazila || "").trim(),
      createdAt: now,
      updatedAt: now,
    };
    data.companies.push(company);
    return company;
  });
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
  return withHealthcareWrite(async (data) => {
    const idx = data.companies.findIndex((c) => c.id === companyId);
    if (idx === -1) return null;
    const current = data.companies[idx]!;
    const linkedDghsIds =
      patch.linkedDghsIds !== undefined
        ? [...new Set(patch.linkedDghsIds.map((id) => String(id).trim()).filter(Boolean))]
        : current.linkedDghsIds;
    const defaults =
      patch.linkedDghsIds !== undefined
        ? await companyDefaultsFromDghs(linkedDghsIds)
        : {};
    const nextName =
      patch.name !== undefined ? patch.name.trim() : current.name || defaults.name || "";
    const nextNameBn =
      patch.nameBn !== undefined
        ? patch.nameBn.trim()
        : current.nameBn || defaults.nameBn || "";
    let linkToken = current.linkToken;
    if (patch.name !== undefined || patch.nameBn !== undefined) {
      const taken = data.companies
        .filter((_, i) => i !== idx)
        .map((c) => c.linkToken);
      linkToken = newHealthcareToken(nextName || nextNameBn || "hospital", taken);
    }
    const next: HealthcareCompany = {
      ...current,
      ...patch,
      name: nextName,
      nameBn: nextNameBn,
      contactPhone:
        patch.contactPhone !== undefined
          ? patch.contactPhone.trim()
          : current.contactPhone || defaults.contactPhone || "",
      contactEmail:
        patch.contactEmail !== undefined
          ? patch.contactEmail.trim()
          : current.contactEmail || defaults.contactEmail || "",
      linkedDghsIds,
      linkToken,
      district:
        patch.district !== undefined
          ? patch.district.trim()
          : current.district || defaults.district || "",
      upazila:
        patch.upazila !== undefined
          ? patch.upazila.trim()
          : current.upazila || defaults.upazila || "",
      updatedAt: new Date().toISOString(),
    };
    data.companies[idx] = next;
    return next;
  });
}

export async function deleteHealthcareCompany(companyId: string): Promise<boolean> {
  return withHealthcareWrite(
    (data) => {
      const before = data.companies.length;
      data.companies = data.companies.filter((c) => c.id !== companyId);
      data.doctors = data.doctors.filter((d) => d.companyId !== companyId);
      data.appointments = data.appointments.filter((a) => a.companyId !== companyId);
      return before !== data.companies.length;
    },
    { allowShrink: true },
  );
}

export async function regenerateHealthcareCompanyToken(
  companyId: string,
): Promise<HealthcareCompany | null> {
  return withHealthcareWrite((data) => {
    const idx = data.companies.findIndex((c) => c.id === companyId);
    if (idx === -1) return null;
    const current = data.companies[idx]!;
    const taken = data.companies
      .filter((_, i) => i !== idx)
      .map((c) => c.linkToken);
    data.companies[idx] = {
      ...current,
      linkToken: newHealthcareToken(
        current.name || current.nameBn || "hospital",
        taken,
      ),
      updatedAt: new Date().toISOString(),
    };
    return data.companies[idx]!;
  });
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
  return withHealthcareWrite((data) => {
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
    return doctor;
  });
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
  return withHealthcareWrite((data) => {
    const idx = data.doctors.findIndex((d) => d.id === doctorId && d.companyId === companyId);
    if (idx === -1) return null;
    const current = data.doctors[idx]!;
    let patchDghsId = patch.dghsId;
    if (patchDghsId !== undefined) {
      const company = findCompanyById(data, companyId);
      const nextDghsId = patchDghsId.trim() || company?.linkedDghsIds[0] || "";
      if (
        nextDghsId &&
        company?.linkedDghsIds.length &&
        !company.linkedDghsIds.includes(nextDghsId)
      ) {
        return null;
      }
      patchDghsId = nextDghsId;
    }
    const next: HealthcareDoctor = {
      ...current,
      ...patch,
      dghsId: patchDghsId !== undefined ? patchDghsId : current.dghsId,
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
    return next;
  });
}

export async function deleteHealthcareDoctor(
  doctorId: string,
  companyId: string,
): Promise<boolean> {
  return withHealthcareWrite(
    (data) => {
      const before = data.doctors.length;
      data.doctors = data.doctors.filter((d) => !(d.id === doctorId && d.companyId === companyId));
      return before !== data.doctors.length;
    },
    { allowShrink: true },
  );
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
  return withHealthcareWrite((data) => {
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
    return appointment;
  });
}

export async function updateHealthcareAppointment(
  appointmentId: string,
  companyId: string,
  patch: Partial<
    Pick<HealthcareAppointment, "status" | "scheduledAt" | "slotStart" | "slotEnd" | "notes">
  > & { date?: string },
): Promise<HealthcareAppointment | null> {
  return withHealthcareWrite((data) => {
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

    return data.appointments[idx]!;
  });
}
