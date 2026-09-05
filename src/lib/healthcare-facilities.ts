import { readFile } from "fs/promises";
import path from "path";

import { slugifyName, uniqueSlug } from "@/lib/url-slug";

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
const CACHE_MS = 6 * 60 * 60 * 1000; // keep DGHS catalog warm — avoids 11MB re-parse
let slugByDghsId: Map<string, string> | null = null;
let facilityBySlug: Map<string, HealthcareFacility> | null = null;
let facilityById: Map<string, HealthcareFacility> | null = null;

function rebuildFacilitySlugIndex(dataset: HealthcareFacilitiesDataset) {
  slugByDghsId = new Map();
  facilityBySlug = new Map();
  facilityById = new Map();
  const taken = new Set<string>();
  for (const f of dataset.facilities) {
    facilityById.set(f.dghsId, f);
    const root = slugifyName(
      [f.name || f.nameBn, f.district, f.upazila].filter(Boolean).join(" "),
    );
    let slug = root;
    if (taken.has(slug)) {
      for (let i = 2; i < 10000; i++) {
        const candidate = `${root.slice(0, Math.max(1, 64 - `-${i}`.length))}-${i}`;
        if (!taken.has(candidate)) {
          slug = candidate;
          break;
        }
      }
    }
    taken.add(slug);
    slugByDghsId.set(f.dghsId, slug);
    facilityBySlug.set(slug, f);
  }
}

function ensureFacilitySlugIndex(dataset: HealthcareFacilitiesDataset) {
  if (!slugByDghsId || !facilityBySlug || !facilityById) rebuildFacilitySlugIndex(dataset);
}

export async function loadHealthcareFacilities(): Promise<HealthcareFacilitiesDataset> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return cached;
  const raw = await readFile(DATA_FILE, "utf8");
  cached = JSON.parse(raw) as HealthcareFacilitiesDataset;
  cachedAt = now;
  rebuildFacilitySlugIndex(cached);
  return cached;
}

export type HealthcareSearchParams = {
  q?: string;
  district?: string;
  division?: string;
  upazila?: string;
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
  upazilas: string[];
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
  const upazila = norm(params.upazila ?? "");
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
  if (upazila) {
    items = items.filter((f) => norm(f.upazila) === upazila);
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

  const upazilaSource = district
    ? dataset.facilities.filter((f) => norm(f.district) === district)
    : dataset.facilities;
  const upazilas = [...new Set(upazilaSource.map((f) => f.upazila).filter(Boolean))].sort(
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
    upazilas,
  };
}

export async function getHealthcareFacilityById(
  dghsId: string,
): Promise<HealthcareFacility | null> {
  const dataset = await loadHealthcareFacilities();
  ensureFacilitySlugIndex(dataset);
  return facilityById?.get(dghsId) ?? null;
}

/** Public URL slug from hospital name (+ location), not the DGHS number. */
export function facilityPublicSlug(
  facility: Pick<HealthcareFacility, "dghsId" | "name" | "nameBn" | "district" | "upazila">,
): string {
  if (cached) ensureFacilitySlugIndex(cached);
  const fromIndex = slugByDghsId?.get(facility.dghsId);
  if (fromIndex) return fromIndex;
  return slugifyName(
    [facility.name || facility.nameBn, facility.district, facility.upazila]
      .filter(Boolean)
      .join(" "),
  );
}

export async function getHealthcareFacilityBySlugOrId(
  key: string,
): Promise<HealthcareFacility | null> {
  const clean = decodeURIComponent(key.trim());
  if (!clean) return null;
  const dataset = await loadHealthcareFacilities();
  ensureFacilitySlugIndex(dataset);
  return facilityById?.get(clean) ?? facilityBySlug?.get(clean) ?? null;
}
