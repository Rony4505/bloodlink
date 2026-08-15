import type { PostUrgency } from "./types";

export const POST_URGENCIES: PostUrgency[] = ["critical", "urgent", "moderate"];

export function urgencyRank(urgency: PostUrgency): number {
  if (urgency === "critical") return 3;
  if (urgency === "urgent") return 2;
  return 1;
}

/** Raise urgency when needed-by date is very soon. */
export function resolvePostUrgency(
  selected: PostUrgency,
  neededBy: string,
): PostUrgency {
  const needed = new Date(`${neededBy}T23:59:59`).getTime();
  if (!Number.isFinite(needed)) return selected;
  const hours = (needed - Date.now()) / (1000 * 60 * 60);
  if (hours <= 24) return "critical";
  if (hours <= 72 && urgencyRank(selected) < urgencyRank("urgent")) {
    return "urgent";
  }
  return selected;
}

export function sortPostsByEmergency<
  T extends { urgency: PostUrgency; neededBy: string; createdAt: string },
>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const urg = urgencyRank(b.urgency) - urgencyRank(a.urgency);
    if (urg !== 0) return urg;
    const byA = new Date(a.neededBy).getTime();
    const byB = new Date(b.neededBy).getTime();
    if (Number.isFinite(byA) && Number.isFinite(byB) && byA !== byB) {
      return byA - byB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
