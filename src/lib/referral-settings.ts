import type { ReferralSettings } from "@/lib/types";

export function defaultReferralSettings(): ReferralSettings {
  return {
    enabled: false,
    rewardAmountBdt: 20,
    rewardOn: "registration",
    cashOutEnabled: false,
    adminNotes: "",
  };
}

export function normalizeReferralSettings(
  raw?: Partial<ReferralSettings> | null,
): ReferralSettings {
  const base = defaultReferralSettings();
  const amount = Number(raw?.rewardAmountBdt);
  return {
    enabled: Boolean(raw?.enabled),
    rewardAmountBdt:
      Number.isFinite(amount) && amount >= 0
        ? Math.min(10_000, Math.round(amount))
        : base.rewardAmountBdt,
    rewardOn: "registration",
    cashOutEnabled: Boolean(raw?.cashOutEnabled),
    adminNotes: String(raw?.adminNotes || "").trim().slice(0, 500),
  };
}
