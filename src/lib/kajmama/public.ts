import { maskPhone } from "./format";
import { isPremiumNow } from "./premium";
import { ratingFor, workerIsBusy } from "./store";
import type { KajmamaStore, PublicUser, SessionUser, User } from "./types";

export function toPublicUser(
  store: KajmamaStore,
  user: User,
  opts?: { revealPhone?: boolean },
): PublicUser {
  const { rating, reviewCount } = ratingFor(store, user.id);
  const plan = store.packages.find((p) => p.id === user.packageId);
  const premium = isPremiumNow(user, store);
  const available = user.role === "worker" ? !workerIsBusy(store, user.id) && !user.blocked : true;
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    district: user.district,
    upazila: user.upazila || "",
    area: user.area,
    bio: user.bio,
    skills: user.skills,
    experienceYears: user.experienceYears,
    hourlyRate: user.hourlyRate,
    jobRate: user.jobRate,
    verified: user.verified,
    premium,
    packageId: user.packageId || "basic",
    packageName: plan ? plan.nameBn : "বেসিক",
    packageExpiresAt: user.packageExpiresAt,
    available,
    createdAt: user.createdAt,
    rating,
    reviewCount,
    phoneMasked: maskPhone(user.phone),
    phone: opts?.revealPhone ? user.phone : undefined,
  };
}

export function toSessionUser(store: KajmamaStore, user: User): SessionUser {
  return {
    ...toPublicUser(store, user, { revealPhone: true }),
    phone: user.phone,
    payout: user.role === "worker" ? user.payout : undefined,
  };
}

export function workerList(
  store: KajmamaStore,
  filters?: {
    q?: string;
    category?: string;
    district?: string;
    upazila?: string;
  },
): PublicUser[] {
  const q = filters?.q?.trim().toLowerCase() || "";
  return store.users
    .filter((u) => u.role === "worker" && !u.blocked)
    .filter((u) => (filters?.category ? u.skills.includes(filters.category) : true))
    .filter((u) => (filters?.district ? u.district === filters.district : true))
    .filter((u) => (filters?.upazila ? u.upazila === filters.upazila : true))
    .filter((u) => {
      if (!q) return true;
      const hay = `${u.name} ${u.area} ${u.upazila} ${u.district} ${u.bio} ${u.skills.join(" ")}`.toLowerCase();
      return hay.includes(q);
    })
    .map((u) => toPublicUser(store, u))
    .sort((a, b) => {
      if (a.premium !== b.premium) return a.premium ? -1 : 1;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    });
}

export { maskPhone };
