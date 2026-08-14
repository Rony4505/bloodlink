/** Format amount in Bangladeshi Taka (৳). */
export function formatTaka(amount: number): string {
  const rounded = Math.round(amount);
  return `৳${rounded.toLocaleString("bn-BD")}`;
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
