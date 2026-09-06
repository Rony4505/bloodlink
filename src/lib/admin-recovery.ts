import { OWNER_EMAIL } from "@/lib/defaults";

/**
 * Admin recovery / security Gmail.
 * Prefer the verified (or saved) admin verifyEmail; else env; else default owner inbox.
 */
export function getAdminRecoveryEmail(verifyEmail?: string | null): string {
  const fromSettings = String(verifyEmail || "")
    .trim()
    .toLowerCase();
  if (fromSettings.includes("@")) return fromSettings;
  const fromEnv = process.env.ADMIN_RECOVERY_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  return OWNER_EMAIL.trim().toLowerCase();
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}
