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

let statsPromise: Promise<StatsPayload> | null = null;

export function loadDonorStats(): Promise<StatsPayload> {
  if (!statsPromise) {
    statsPromise = fetch("/api/donors/stats")
      .then((r) => r.json())
      .then((data) => ({
        totalAvailable: Number(data.totalAvailable) || 0,
        totalUnavailable: Number(data.totalUnavailable) || 0,
        total: Number(data.total) || 0,
        byGroup: data.byGroup || [],
      }))
      .catch(() => {
        statsPromise = null;
        return {
          totalAvailable: 0,
          totalUnavailable: 0,
          total: 0,
          byGroup: [],
        };
      });
  }
  return statsPromise;
}
