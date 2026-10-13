export function formatBdt(amount: number, currency = "BDT"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${value.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
