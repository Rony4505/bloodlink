const WEIGHT_UNITS = new Set(["কেজি", "লিটার", "গ্রাম"]);

export function isWeightUnit(unit: string): boolean {
  return WEIGHT_UNITS.has(unit);
}

/** Normalize weight to kg for price calculation. */
export function weightInKg(weight: number, unit: string): number {
  if (unit === "গ্রাম") return weight / 1000;
  return weight;
}

export function formatWeightDisplay(weight: number, unit: string): string {
  if (unit === "গ্রাম") return `${weight.toFixed(0)} গ্রাম`;
  return `${weight.toFixed(3)} ${unit}`;
}
