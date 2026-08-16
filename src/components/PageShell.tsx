"use client";

import { Header } from "@/components/Header";
import { OrgBanners } from "@/components/OrgBanners";
import { SiteFooter } from "@/components/SiteFooter";
import type { BannerPage } from "@/lib/types";

export function PageShell({
  children,
  title,
  subtitle,
  bannerPage,
  compactHeader = false,
  showAds = true,
  showStoryForm = true,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  bannerPage?: BannerPage;
  compactHeader?: boolean;
  /** Org advertisement banners (default on when bannerPage is set). */
  showAds?: boolean;
  /** Success-story form in footer. */
  showStoryForm?: boolean;
}) {
  const ads = Boolean(showAds && bannerPage);
  return (
    <div className="flex min-h-full flex-col">
      <div
        className={`relative overflow-hidden bg-[linear-gradient(145deg,#6e1220_0%,#9b1b2e_45%,#3d1a1f_100%)] pb-16 pt-24 text-white sm:pt-28`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(214,69,80,0.45),transparent_40%)]" />
        <Header compact={compactHeader} />
        <div className="relative mx-auto max-w-6xl px-5 md:px-8">
          <h1 className="animate-rise font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="animate-rise-delay mt-3 max-w-2xl text-base text-white/85 md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {ads ? <OrgBanners page={bannerPage!} placement="after-hero" /> : null}
      <main
        className={`relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 pb-16 md:px-8 ${
          ads ? "mt-5 md:mt-6" : "-mt-8"
        }`}
      >
        {children}
      </main>
      {ads ? <OrgBanners page={bannerPage!} placement="before-footer" /> : null}
      <SiteFooter showStoryForm={showStoryForm} />
    </div>
  );
}
