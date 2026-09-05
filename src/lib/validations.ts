import { z } from "zod";
import { BLOOD_GROUPS, DISTRICTS } from "./districts";
import { isValidBdPhone, normalizePhone } from "./privacy";
import { normalizeOtpCode } from "./otp-code";

const bloodGroupSchema = z.enum(BLOOD_GROUPS);
const districtSchema = z.enum(DISTRICTS);
const genderSchema = z.enum(["male", "female"]);

/** Normalize optional YYYY-MM-DD (or common variants). Invalid → null (optional fields). */
export function normalizeOptionalIsoDate(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return null;
  }
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const t = Date.parse(`${raw}T00:00:00Z`);
    return Number.isFinite(t) ? raw : null;
  }
  // 2024-1-5 → 2024-01-05
  const loose = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (loose) {
    const y = loose[1]!;
    const m = loose[2]!.padStart(2, "0");
    const d = loose[3]!.padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    const t = Date.parse(`${iso}T00:00:00Z`);
    return Number.isFinite(t) ? iso : null;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
    const t = Date.parse(`${iso}T00:00:00Z`);
    return Number.isFinite(t) ? iso : null;
  }
  return null;
}

function normalizeOptionalDonationCount(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(500, Math.floor(n)));
}

function normalizeBloodGroup(value: unknown): string {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .toUpperCase();
}

/** Pick + coerce register payload so extra keys (action, volunteerToken) never break validation. */
export function coerceRegisterPayload(body: unknown): Record<string, unknown> {
  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const lastDonationDate = normalizeOptionalIsoDate(raw.lastDonationDate);
  const donationCount = normalizeOptionalDonationCount(raw.donationCount);
  const bloodIssue =
    raw.bloodIssue == null ? "" : String(raw.bloodIssue).trim().slice(0, 300);
  return {
    name: String(raw.name ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    phone: String(raw.phone ?? "").trim(),
    password: String(raw.password ?? ""),
    gender: String(raw.gender ?? "male").trim().toLowerCase(),
    bloodGroup: normalizeBloodGroup(raw.bloodGroup),
    district: String(raw.district ?? "").trim(),
    area: String(raw.area ?? "").trim(),
    lastDonationDate,
    bloodIssue,
    ...(donationCount !== undefined ? { donationCount } : {}),
  };
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  /** Required — donor verification is Gmail OTP only. */
  email: z.string().trim().email("Valid email required").max(120),
  phone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required (01XXXXXXXXX)"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
  gender: genderSchema,
  bloodGroup: bloodGroupSchema,
  district: districtSchema,
  area: z.string().trim().min(2, "Please select / enter area").max(80),
  // Optional — empty/invalid dates already coerced to null
  lastDonationDate: z.union([z.string().date(), z.null()]).optional().nullable(),
  bloodIssue: z.string().trim().max(300).optional().default(""),
  donationCount: z.number().int().min(0).max(500).optional(),
});

/** Human-readable first validation error for API clients. */
export function formatRegisterValidationError(
  error: z.ZodError,
): { error: string; fieldErrors: Record<string, string[]> } {
  const flat = error.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[]>;
  const firstField = Object.keys(fieldErrors)[0];
  const firstMsg =
    (firstField && fieldErrors[firstField]?.[0]) ||
    flat.formErrors[0] ||
    "Invalid registration data";
  return { error: firstMsg, fieldErrors };
}

/** Login with Gmail or Bangladesh mobile + password. */
export const loginSchema = z.object({
  email: z.string().trim().min(3).max(120),
  password: z.string().min(1),
});

/** Placeholder email when the donor skips Gmail at registration. */
export function phonePlaceholderEmail(phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return `${digits}@phone.bloodlink.local`;
}

export function isPhonePlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@phone.bloodlink.local");
}

export const adminLoginSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(1),
});

export const updateDonorSchema = z.object({
  lastDonationDate: z
    .union([z.string().date(), z.literal(""), z.null()])
    .optional(),
  bloodIssue: z.string().trim().max(300).optional(),
  donationCount: z.coerce.number().int().min(0).max(500).optional(),
});

export const contactChangeSchema = z
  .object({
    requestedEmail: z
      .union([z.string().trim().email().max(120), z.literal(""), z.null()])
      .optional(),
    requestedPhone: z
      .union([
        z
          .string()
          .trim()
          .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
        z.literal(""),
        z.null(),
      ])
      .optional(),
    note: z.string().trim().max(300).optional().default(""),
  })
  .refine(
    (data) =>
      Boolean(
        (data.requestedEmail && data.requestedEmail.length > 0) ||
          (data.requestedPhone && data.requestedPhone.length > 0),
      ),
    { message: "Provide a new email and/or phone" },
  );

export const searchSchema = z.object({
  bloodGroup: bloodGroupSchema.optional(),
  district: districtSchema.optional(),
  availableOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

export const contactSchema = z.object({
  donorId: z.string().uuid(),
  seekerName: z.string().trim().min(2).max(80),
  seekerPhone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
  hospital: z.string().trim().min(2).max(120),
});

export const ratingSchema = z.object({
  donorId: z.string().uuid(),
  seekerName: z.string().trim().min(2).max(80),
  seekerPhone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(400).optional().default(""),
});

export const postSchema = z.object({
  posterName: z.string().trim().min(2).max(80),
  posterPhone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
  patientName: z.string().trim().min(2).max(80),
  relation: z.string().trim().min(2).max(80),
  bloodGroup: bloodGroupSchema,
  unitsNeeded: z.coerce.number().int().min(1).max(20),
  district: districtSchema,
  area: z.string().trim().min(2).max(80),
  hospital: z.string().trim().min(2).max(120),
  neededBy: z.string().date(),
  message: z.string().trim().min(5).max(500),
  urgency: z.enum(["critical", "urgent", "moderate"]).default("urgent"),
});

export const registerConfirmSchema = z.object({
  pendingId: z.string().uuid(),
  emailCode: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform(normalizeOtpCode)
    .refine((v) => v.length >= 4 && v.length <= 10, "Invalid verification code"),
});

export const registerResendSchema = z.object({
  pendingId: z.string().uuid(),
  channel: z.enum(["email"]).default("email"),
});

export const resetPasswordSendSchema = z.object({
  email: z.string().trim().email().max(120),
});

export const resetPasswordVerifySchema = z.object({
  email: z.string().trim().email().max(120),
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform(normalizeOtpCode)
    .refine((v) => v.length >= 4 && v.length <= 10, "Invalid verification code"),
});

export const resetPasswordConfirmSchema = z.object({
  email: z.string().trim().email().max(120),
  newPassword: z.string().min(8).max(72),
});

export const successStorySubmitSchema = z.object({
  name: z.string().trim().min(2).max(80),
  quote: z.string().trim().min(20).max(800),
  handle: z.string().trim().max(60).optional().default(""),
});

export const privacyUpdateSchema = z.object({
  privacyBn: z.string().trim().min(20).max(20000),
  privacyEn: z.string().trim().min(20).max(20000),
});

export const adminCredentialsSchema = z.object({
  currentPassword: z.string().min(1),
  newUsername: z.string().trim().min(3).max(80).optional(),
  newPassword: z.string().min(8).max(72).optional(),
});

export const adminVerifySetupSchema = z.object({
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidBdPhone(v), "Valid BD phone required"),
});

export const adminVerifyCodeSchema = z.object({
  channel: z.enum(["email", "phone"]),
  code: z.string().trim().min(4).max(10),
});

const platformFeatureSchema = z.object({
  enabled: z.boolean(),
  notes: z.string().trim().max(500).optional().default(""),
});

export const platformOptionsSchema = z.object({
  hospitalAccess: platformFeatureSchema,
  orgAds: platformFeatureSchema,
  futureServices: platformFeatureSchema,
});

const notificationChannelSchema = z.object({
  enabled: z.boolean(),
  locked: z.boolean().optional().default(false),
  intervalDays: z.number().int().min(1).max(30),
  hourBd: z.number().int().min(0).max(23),
  notes: z.string().trim().max(500).optional().default(""),
});

export const notificationSettingsSchema = z.object({
  bloodRequestBroadcast: notificationChannelSchema,
  dailyDonationReminder: notificationChannelSchema,
  contactChangeAlerts: notificationChannelSchema,
  systemAnnouncements: notificationChannelSchema,
  monthlyGoldBlessing: notificationChannelSchema,
});

export const notificationBroadcastSchema = z.object({
  titleEn: z.string().trim().min(2).max(120),
  titleBn: z.string().trim().min(2).max(120),
  bodyEn: z.string().trim().min(2).max(500),
  bodyBn: z.string().trim().min(2).max(500),
  href: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("/notifications"),
});

export function normalizeRegisterInput(data: z.infer<typeof registerSchema>) {
  const phone = normalizePhone(data.phone);
  return {
    ...data,
    email: data.email.trim().toLowerCase(),
    phone,
    bloodIssue: data.bloodIssue || "",
    lastDonationDate:
      !data.lastDonationDate || data.lastDonationDate === ""
        ? null
        : data.lastDonationDate,
    donationCount:
      data.donationCount != null
        ? Math.max(0, Math.floor(Number(data.donationCount) || 0))
        : undefined,
  };
}

export const volunteerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || isValidBdPhone(v), "Valid BD phone required")
    .optional()
    .or(z.literal("")),
  email: z
    .union([z.string().trim().email().max(120), z.literal("")])
    .optional(),
  district: z.string().trim().max(80).optional().default(""),
  role: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional().default(""),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username: letters, numbers, . _ - only")
    .optional()
    .or(z.literal("")),
  password: z.string().min(6).max(72).optional().or(z.literal("")),
  enabled: z.boolean().optional().default(true),
});

export const volunteerUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || isValidBdPhone(v), "Valid BD phone required")
    .optional()
    .or(z.literal("")),
  email: z
    .union([z.string().trim().email().max(120), z.literal("")])
    .optional(),
  district: z.string().trim().max(80).optional(),
  role: z.string().trim().min(2).max(80).optional(),
  notes: z.string().trim().max(500).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  password: z.string().min(6).max(72).optional().or(z.literal("")),
  enabled: z.boolean().optional(),
});

export const volunteerActivitySchema = z.object({
  volunteerId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().default(""),
  activityType: z.string().trim().min(2).max(60).default("other"),
  status: z.enum(["planned", "in_progress", "done"]).default("planned"),
  activityDate: z.string().date(),
});

export const volunteerDonorCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
  gender: z.enum(["male", "female"]).default("male"),
  bloodGroup: bloodGroupSchema,
  district: districtSchema,
  area: z.string().trim().min(2).max(80),
  lastDonationDate: z
    .union([z.string().date(), z.literal(""), z.null()])
    .optional()
    .nullable(),
  donationCount: z.coerce.number().int().min(0).max(500).optional(),
  /** Temporary password for the donor (they can log in later). */
  tempPassword: z.string().min(6).max(72),
});

export const volunteerDonorUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required")
    .optional(),
});

export const volunteerLoginSchema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(1).max(72),
});

export const volunteerTaskUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["planned", "in_progress", "done"]).optional(),
  volunteerNote: z.string().trim().max(1000).optional(),
});
