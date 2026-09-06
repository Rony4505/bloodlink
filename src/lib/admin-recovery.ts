import { OWNER_EMAIL } from "@/lib/defaults";

/** Official admin recovery Gmail (locked). Not editable from settings. */
export function getAdminRecoveryEmail(): string {
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
