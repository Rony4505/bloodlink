export function taka(amount: number): string {
  if (!Number.isFinite(amount)) return "৳০";
  return `৳${Math.round(amount).toLocaleString("bn-BD")}`;
}

export function takaEn(amount: number): string {
  if (!Number.isFinite(amount)) return "৳0";
  return `৳${Math.round(amount).toLocaleString("en-BD")}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "কা";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ""}${parts[1][0] || ""}`;
}

export function avatarTone(seed: string): string {
  const tones = ["#1d3a4d", "#3a2a1b", "#243528", "#3b2436", "#2c2a4a", "#3d2e18"];
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n + seed.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[n];
}

export function timeAgo(iso: string, bn: boolean): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return bn ? `${min} মিনিট আগে` : `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return bn ? `${hr} ঘণ্টা আগে` : `${hr}h ago`;
  const day = Math.round(hr / 24);
  return bn ? `${day} দিন আগে` : `${day}d ago`;
}

export function maskPhone(phone: string): string {
  const p = phone.replace(/\D/g, "");
  if (p.length < 8) return "01XXXXXXX";
  return `${p.slice(0, 3)}XXXX${p.slice(-4)}`;
}
