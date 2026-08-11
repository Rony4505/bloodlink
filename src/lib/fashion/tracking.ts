export function generateTrackingNumber(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SG${Date.now().toString().slice(-8)}${rand}`;
}
