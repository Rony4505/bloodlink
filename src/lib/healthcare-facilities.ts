import { readFile } from "fs/promises";
import path from "path";

export type HealthcareFacility = {
  dghsId: string;
  code: string;
  name: string;
  nameBn: string;
  email: string;
  phone: string;
  type: string;
  category: "hospital" | "diagnostic";
  agency: string;
  division: string;
  district: string;
  upazila: string;
  cityCorporation: string;
  union: string;
  paurasava: string;
  isPrivate: boolean;
  address: string;
};

export type HealthcareFacilitiesDataset = {
  source: string;
  sourceUrl: string;
  importedAt: string;
  total: number;
  hospitals: number;
  diagnostics: number;
  facilities: HealthcareFacility[];
};

const DATA_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "dghs-healthcare-facilities.json",
);

let cached: HealthcareFacilitiesDataset | null = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

export async function loadHealthcareFacilities(): Promise<HealthcareFacilitiesDataset> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return cached;
  const raw = await readFile(DATA_FILE, "utf8");
  cached = JSON.parse(raw) as HealthcareFacilitiesDataset;
  cachedAt = now;
  return cached;
}

export type HealthcareSearchParams = {
  q?: string;
  district?: string;
  division?: string;
  category?: "all" | "hospital" | "diagnostic";
  page?: number;
  limit?: number;
};

export type HealthcareSearchResult = {
  items: HealthcareFacility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: Pick<
    HealthcareFacilitiesDataset,
    "source" | "sourceUrl" | "importedAt" | "total" | "hospitals" | "diagnostics"
  >;
  districts: string[];
  divisions: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export async function searchHealthcareFacilities(
  params: HealthcareSearchParams,
): Promise<HealthcareSearchResult> {
  const dataset = await loadHealthcareFacilities();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(10, params.limit ?? 50));
  const q = norm(params.q ?? "");
  const district = norm(params.district ?? "");
  const division = norm(params.division ?? "");
  const category = params.category ?? "all";

  let items = dataset.facilities;

  if (category !== "all") {
    items = items.filter((f) => f.category === category);
  }
  if (district) {
    items = items.filter((f) => norm(f.district) === district);
  }
  if (division) {
    items = items.filter((f) => norm(f.division) === division);
  }
  if (q) {
    items = items.filter((f) => {
      const hay = [
        f.name,
        f.nameBn,
        f.email,
        f.phone,
        f.address,
        f.type,
        f.district,
        f.upazila,
        f.code,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageItems = items.slice(start, start + limit);

  const districts = [...new Set(dataset.facilities.map((f) => f.district).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
  const divisions = [...new Set(dataset.facilities.map((f) => f.division).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );

  return {
    items: pageItems,
    total,
    page,
    limit,
    totalPages,
    meta: {
      source: dataset.source,
      sourceUrl: dataset.sourceUrl,
      importedAt: dataset.importedAt,
      total: dataset.total,
      hospitals: dataset.hospitals,
      diagnostics: dataset.diagnostics,
    },
    districts,
    divisions,
  };
}
