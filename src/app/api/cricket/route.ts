import { fail, ok } from "@/lib/cricket/http";
import { readCricketStore } from "@/lib/cricket/store";
import { tenantAccessOk } from "@/lib/cricket/format";

export const runtime = "nodejs";

export async function GET() {
  try {
    const store = await readCricketStore();
    return ok({
      settings: {
        siteName: store.settings.siteName,
        tagline: store.settings.tagline,
        contactPhone: store.settings.contactPhone,
      },
      demoSlug: "demo",
      tenantsPublic: store.tenants
        .filter((t) => tenantAccessOk(t))
        .map((t) => ({
          slug: t.slug,
          name: t.name,
          brandColor: t.brandColor,
          plan: t.plan,
        })),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load", 500);
  }
}
