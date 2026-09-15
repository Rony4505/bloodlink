import type { Advertisement, KajmamaStore, PackagePlan, User } from "./types";

export function findPackage(store: KajmamaStore, id: string): PackagePlan | undefined {
  return store.packages.find((p) => p.id === id);
}

export function isPremiumNow(user: User, store: KajmamaStore, now = Date.now()): boolean {
  if (user.role !== "worker") return false;
  const plan = findPackage(store, user.packageId);
  if (!plan?.premium || !plan.active) return false;
  if (!user.packageExpiresAt) return false;
  return new Date(user.packageExpiresAt).getTime() > now;
}

export function expirePackages(store: KajmamaStore, now = Date.now()): boolean {
  let changed = false;
  for (const u of store.users) {
    if (u.role !== "worker") continue;
    const plan = findPackage(store, u.packageId);
    if (!u.packageExpiresAt) continue;
    if (new Date(u.packageExpiresAt).getTime() <= now || !plan?.premium) {
      if (u.packageId !== "basic" || u.packageExpiresAt !== null) {
        u.packageId = "basic";
        u.packageExpiresAt = null;
        changed = true;
      }
    }
  }
  return changed;
}

export function applyPackage(user: User, plan: PackagePlan, now = Date.now()) {
  user.packageId = plan.id;
  if (!plan.premium || plan.durationDays <= 0) {
    user.packageExpiresAt = null;
    return;
  }
  user.packageExpiresAt = new Date(now + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
}

export function adsFor(store: KajmamaStore, placement: Advertisement["placement"]): Advertisement[] {
  return store.ads.filter((a) => a.active && a.placement === placement);
}

export function siteFeeOf(price: number, pct: number) {
  const fee = Math.round((Math.max(0, price) * Math.max(0, pct)) / 100);
  return { siteFee: fee, workerPayout: Math.max(0, Math.round(price) - fee) };
}
