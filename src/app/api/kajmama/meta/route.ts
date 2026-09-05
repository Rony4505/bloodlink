import { DISTRICTS } from "@/lib/kajmama/constants";
import { UPAZILAS } from "@/lib/kajmama/geo";
import { fail, ok } from "@/lib/kajmama/http";
import { adsFor } from "@/lib/kajmama/premium";
import { categoriesWithCounts, readKajmamaStore } from "@/lib/kajmama/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const store = await readKajmamaStore();
    return ok({
      categories: categoriesWithCounts(store),
      packages: store.packages.filter((p) => p.active),
      allPackages: store.packages,
      districts: DISTRICTS,
      upazilas: UPAZILAS,
      ads: store.ads.filter((a) => a.active),
      contact: {
        phone: store.settings.contactPhone,
        email: store.settings.contactEmail,
        whatsapp: store.settings.contactWhatsapp,
        facebook: store.settings.contactFacebook,
      },
      payments: {
        banks: store.settings.banks,
        mobiles: store.settings.mobiles,
        commissionPct: store.settings.commissionPct,
      },
      adsByPlacement: {
        home_hero: adsFor(store, "home_hero"),
        home_categories: adsFor(store, "home_categories"),
        home_premium: adsFor(store, "home_premium"),
        workers_top: adsFor(store, "workers_top"),
        workers_sidebar: adsFor(store, "workers_sidebar"),
        profile_sidebar: adsFor(store, "profile_sidebar"),
        jobs_top: adsFor(store, "jobs_top"),
        all_pages: adsFor(store, "all_pages"),
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 500);
  }
}
