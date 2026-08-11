import { z } from "zod";
import { BLOOD_GROUPS, DISTRICTS } from "./districts";
import { isValidBdPhone, normalizePhone } from "./privacy";

const bloodGroupSchema = z.enum(BLOOD_GROUPS);
const districtSchema = z.enum(DISTRICTS);
const genderSchema = z.enum(["male", "female"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
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
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(1),
});

export const updateDonorSchema = z.object({
  lastDonationDate: z
    .union([z.string().date(), z.literal(""), z.null()])
    .optional(),
  bloodIssue: z.string().trim().max(300).optional(),
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
  return {
    ...data,
    email: data.email.toLowerCase(),
    phone: normalizePhone(data.phone),
    bloodIssue: data.bloodIssue || "",
    lastDonationDate:
      !data.lastDonationDate || data.lastDonationDate === ""
        ? null
        : data.lastDonationDate,
  };
}
