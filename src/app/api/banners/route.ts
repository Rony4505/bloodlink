import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/db";
import {
  BANNER_PAGES,
  BANNER_PLACEMENTS,
  bannerMatches,
  normalizeBannerSlideIntervalSec,
} from "@/lib/site-cms";
import type { BannerPage, BannerPlacement } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page") || "home";
  const placementParam = searchParams.get("placement") || "";

  const page = BANNER_PAGES.includes(pageParam as BannerPage)
    ? (pageParam as BannerPage)
    : "home";
  const placement = BANNER_PLACEMENTS.includes(placementParam as BannerPlacement)
    ? (placementParam as BannerPlacement)
    : null;

  const admin = await getAdminSettings();
  let banners = (admin.banners || []).filter((b) => b.enabled);

  if (placement) {
    banners = banners.filter((b) => bannerMatches(b, page, placement));
  } else {
    banners = banners.filter(
      (b) => b.pages.includes("all") || b.pages.includes(page),
    );
  }

  return NextResponse.json({
    banners,
    slideIntervalSec: normalizeBannerSlideIntervalSec(admin.bannerSlideIntervalSec),
  });
}
