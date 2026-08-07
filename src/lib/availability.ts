import type { Gender } from "./types";

/** Whole-blood waiting period used across Bangladesh / common guidelines. */
export const WAIT_DAYS: Record<Gender, number> = {
  male: 90,
  female: 120,
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseDonationDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function getWaitDays(gender: Gender | null | undefined): number {
  return gender === "female" ? WAIT_DAYS.female : WAIT_DAYS.male;
}

export function getNextEligibleDate(
  gender: Gender | null | undefined,
  lastDonationDate: string | null | undefined,
): string | null {
  const donated = parseDonationDate(lastDonationDate);
  if (!donated) return null;
  const next = addDays(startOfDay(donated), getWaitDays(gender));
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDonorAvailable(
  gender: Gender | null | undefined,
  lastDonationDate: string | null | undefined,
): boolean {
  const next = getNextEligibleDate(gender, lastDonationDate);
  if (!next) return true;
  const eligible = parseDonationDate(next);
  if (!eligible) return true;
  return startOfDay(new Date()) >= startOfDay(eligible);
}

export function daysUntilEligible(
  gender: Gender | null | undefined,
  lastDonationDate: string | null | undefined,
): number | null {
  const next = getNextEligibleDate(gender, lastDonationDate);
  if (!next) return null;
  const eligible = parseDonationDate(next);
  if (!eligible) return null;
  const today = startOfDay(new Date());
  const diff = Math.ceil(
    (startOfDay(eligible).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : 0;
}
