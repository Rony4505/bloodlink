import type { CartLine } from "./types";
import { isWeightUnit, weightInKg } from "./units";

/** Format amount in Bangladeshi Taka (৳). */
export function formatTaka(amount: number): string {
  const rounded = Math.round(amount);
  return `৳${rounded.toLocaleString("bn-BD")}`;
}

export function formatTakaDecimal(amount: number): string {
  return `৳${amount.toLocaleString("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function lineTotal(line: CartLine): number {
  if (line.weight != null && isWeightUnit(line.unit)) {
    return Math.round(line.price * weightInKg(line.weight, line.unit));
  }
  return line.price * line.qty;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

export function saleDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

/** Pick readable text color for a product button background. */
export function textOnColor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#1c1412";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1c1412" : "#ffffff";
}
