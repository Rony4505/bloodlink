type StatsPayload = {
  totalAvailable: number;
  totalUnavailable: number;
  total?: number;
  byGroup?: Array<{
    bloodGroup: string;
    available: number;
    unavailable: number;
    total: number;
  }>;
};

const CLIENT_TTL_MS = 5_000;

let cached: { at: number; data: StatsPayload } | null = null;
let inflight: Promise<StatsPayload> | null = null;

function emptyStats(): StatsPayload {
  return {
    totalAvailable: 0,
    totalUnavailable: 0,
    total: 0,
    byGroup: [],
  };
}

/** Drop client cache so the next load fetches fresh counts. */
export function invalidateDonorStats() {
  cached = null;
  inflight = null;
}

export function loadDonorStats(options?: { force?: boolean }): Promise<StatsPayload> {
  const force = Boolean(options?.force);
  const now = Date.now();

  if (!force && cached && now - cached.at < CLIENT_TTL_MS) {
    return Promise.resolve(cached.data);
  }

  if (!force && inflight) return inflight;

  inflight = fetch("/api/donors/stats", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      const payload: StatsPayload = {
        totalAvailable: Number(data.totalAvailable) || 0,
        totalUnavailable: Number(data.totalUnavailable) || 0,
        total: Number(data.total) || 0,
        byGroup: Array.isArray(data.byGroup) ? data.byGroup : [],
      };
      cached = { at: Date.now(), data: payload };
      return payload;
    })
    .catch(() => {
      invalidateDonorStats();
      return emptyStats();
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
