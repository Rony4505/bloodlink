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
  const tones = ["#0f3d3e", "#165557", "#1c4d3d", "#2a4a4a", "#123e4a", "#25403a"];
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

export function peopleCount(n: number, bn: boolean): string {
  const num = bn ? n.toLocaleString("bn-BD") : String(n);
  if (bn) return `${num} জন`;
  return n === 1 ? "1 worker" : `${num} workers`;
}

export function maskPhone(phone: string): string {
  const p = phone.replace(/\D/g, "");
  if (p.length < 8) return "01XXXXXXX";
  return `${p.slice(0, 3)}XXXX${p.slice(-4)}`;
}

const PORTRAITS = [
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=60",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=60",
];

export function photoUrlFor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n += id.charCodeAt(i) * (i + 3);
  return PORTRAITS[Math.abs(n) % PORTRAITS.length];
}
