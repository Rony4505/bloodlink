import { maskPhone } from "./format";
import { ratingFor } from "./store";
import type { KajmamaStore, PublicUser, SessionUser, User } from "./types";

export function toPublicUser(
  store: KajmamaStore,
  user: User,
  opts?: { revealPhone?: boolean },
): PublicUser {
  const { rating, reviewCount } = ratingFor(store, user.id);
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    district: user.district,
    area: user.area,
    bio: user.bio,
    skills: user.skills,
    experienceYears: user.experienceYears,
    hourlyRate: user.hourlyRate,
    jobRate: user.jobRate,
    verified: user.verified,
    available: user.available,
    createdAt: user.createdAt,
    rating,
    reviewCount,
    phone: opts?.revealPhone ? user.phone : undefined,
  };
}

export function toSessionUser(store: KajmamaStore, user: User): SessionUser {
  return { ...toPublicUser(store, user, { revealPhone: true }), phone: user.phone };
}

export function workerList(store: KajmamaStore, filters?: {
  q?: string;
  category?: string;
  district?: string;
}): PublicUser[] {
  const q = filters?.q?.trim().toLowerCase() || "";
  return store.users
    .filter((u) => u.role === "worker" && !u.blocked)
    .filter((u) => (filters?.category ? u.skills.includes(filters.category) : true))
    .filter((u) => (filters?.district ? u.district === filters.district : true))
    .filter((u) => {
      if (!q) return true;
      const hay = `${u.name} ${u.area} ${u.district} ${u.bio} ${u.skills.join(" ")}`.toLowerCase();
      return hay.includes(q);
    })
    .map((u) => toPublicUser(store, u))
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    });
}

export { maskPhone };
