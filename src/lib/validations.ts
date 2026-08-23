import { z } from "zod";
import { BLOOD_GROUPS, DISTRICTS } from "./districts";
import { isValidBdPhone, normalizePhone } from "./privacy";

const bloodGroupSchema = z.enum(BLOOD_GROUPS);
const districtSchema = z.enum(DISTRICTS);
const genderSchema = z.enum(["male", "female"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  /** Required — donor verification is Gmail OTP only. */
  email: z.string().trim().email().max(120),
  phone: z
    .string()
    .trim()
    .refine(isValidBdPhone, "Valid Bangladesh mobile required"),
  password: z.string().min(8).max(72),
  gender: genderSchema,
  bloodGroup: bloodGroupSchema,
  district: districtSchema,
  area: z.string().trim().min(2).max(80),
  lastDonationDate: z
    .union([z.string().date(), z.literal(""), z.null()])
    .optional(),
  bloodIssue: z.string().trim().max(300).optional().default(""),
  donationCount: z.coerce.number().int().min(0).max(500).optional(),
});

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
  emailCode: z.string().trim().min(4).max(10),
});

export const registerResendSchema = z.object({
  pendingId: z.string().uuid(),
  channel: z.enum(["email"]).default("email"),
});

export const resetPasswordSendSchema = z.object({
  email: z.string().trim().email().max(120),
});

export const resetPasswordConfirmSchema = z.object({
  email: z.string().trim().email().max(120),
  code: z.string().trim().min(4).max(10),
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
    .regex(/^[a-zA-Z0-9._-]+$/, "Username: letters, numbers, . _ - only"),
  password: z.string().min(6).max(72),
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
    .optional(),
  donationCount: z.coerce.number().int().min(0).max(500).optional(),
  /** Temporary password for the donor (they can log in later). */
  tempPassword: z.string().min(8).max(72),
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
