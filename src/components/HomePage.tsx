"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DailyReminder } from "@/components/DailyReminder";
import { DonorPushEnableGate } from "@/components/DonorPushEnableGate";
import { Header } from "@/components/Header";
import { HomeDonorTotals } from "@/components/HomeBloodGroupStats";
import { OrgBanners } from "@/components/OrgBanners";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/lib/i18n/locale-context";
import { loadLoggedIn, subscribeSessionMe } from "@/lib/session-me-client";

const BloodHeroBackground = dynamic(
  () =>
    import("@/components/blood-hero/BloodHeroBackground").then(
      (m) => m.BloodHeroBackground,
    ),
  { ssr: false },
);
const HomeEmergencyPosts = dynamic(
  () =>
    import("@/components/HomeEmergencyPosts").then((m) => m.HomeEmergencyPosts),
  { ssr: false },
);
const HomeImpact = dynamic(
  () => import("@/components/HomeImpact").then((m) => m.HomeImpact),
  { ssr: false },
);
const HomeDonors = dynamic(
  () => import("@/components/HomeDonors").then((m) => m.HomeDonors),
  { ssr: false },
);
const HomeBloodGroupStats = dynamic(
  () =>
    import("@/components/HomeBloodGroupStats").then(
      (m) => m.HomeBloodGroupStats,
    ),
  { ssr: false },
);
const AboutContent = dynamic(
  () => import("@/components/AboutContent").then((m) => m.AboutContent),
  { ssr: false },
);
const SafetyWarnings = dynamic(
  () => import("@/components/SafetyWarnings").then((m) => m.SafetyWarnings),
  { ssr: false },
);

export function HomePage() {
  const { t } = useLocale();
  const { brand, tagline, heroSupport, logoUrl } = useSiteAppearance();
  const [loggedIn, setLoggedIn] = useState(false);
  const isLocalLogo =
    logoUrl.startsWith("/") && !logoUrl.startsWith("/api/");

  useEffect(() => {
    const ctrl = new AbortController();
    void loadLoggedIn({ force: true }).then((ok) => {
      if (!ctrl.signal.aborted) setLoggedIn(ok);
    });
    const unsub = subscribeSessionMe((ok) => {
      if (!ctrl.signal.aborted) setLoggedIn(ok);
    });
    return () => {
      ctrl.abort();
      unsub();
    };
  }, []);

  return (
    <div className="home-immersive relative isolate min-h-full">
      <div className="pointer-events-none fixed inset-0 z-0">
        <BloodHeroBackground fixed />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(8,2,4,0.05),rgba(12,3,8,0.42))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,2,4,0.08)_0%,rgba(18,4,8,0.28)_55%,rgba(10,2,6,0.45)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col text-white">
        <DailyReminder enabled={loggedIn} />
        {loggedIn ? <DonorPushEnableGate /> : null}

        <section className="relative min-h-[100svh] overflow-hidden">
          <Header glassNav />
          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24">
            <div className="animate-rise flex items-center gap-4 md:gap-5">
              {isLocalLogo ? (
                <Image
                  src={logoUrl}
                  alt={brand}
                  width={88}
                  height={88}
                  priority
                  className="h-16 w-16 rounded-full bg-white/95 object-cover shadow-lg ring-2 ring-white/30 md:h-[88px] md:w-[88px]"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={brand}
                  className="h-16 w-16 rounded-full bg-white/95 object-cover shadow-lg ring-2 ring-white/30 md:h-[88px] md:w-[88px]"
                  decoding="async"
                />
              )}
              <p className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight drop-shadow md:text-7xl">
                {brand}
              </p>
            </div>
            <p className="animate-rise-delay mt-4 inline-flex">
              <span className="hero-glass-badge">
                <span aria-hidden>🩸</span>
                {t.heroBloodBadge}
              </span>
            </p>
            <h1 className="animate-rise-delay home-title mt-3 max-w-2xl text-2xl font-medium leading-snug md:text-3xl">
              {tagline}
            </h1>
            <p className="animate-rise-delay-2 home-muted mt-4 max-w-xl text-base leading-relaxed md:text-lg">
              {heroSupport}
            </p>
            <div className="animate-rise-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/find" className="btn-glass-primary">
                {t.findDonors}
              </Link>
              <Link href="/register" className="btn-glass-secondary">
                {t.becomeDonor}
              </Link>
              <Link href="/requests" className="btn-glass-secondary">
                {t.requestBlood}
              </Link>
            </div>
            <HomeDonorTotals />
          </div>
        </section>

        <OrgBanners page="home" placement="after-hero" immersive />
        <HomeEmergencyPosts immersive />
        <HomeImpact immersive />
        <HomeDonors immersive />
        <HomeBloodGroupStats immersive />

        <section className="home-glass-section px-5 py-16 md:px-8 md:py-20">
          <div className="home-glass-panel mx-auto max-w-6xl p-6 md:p-8">
            <h2 className="home-title font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              {t.howItWorks}
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                [t.how1Title, t.how1Body],
                [t.how2Title, t.how2Body],
                [t.how3Title, t.how3Body],
              ].map(([title, body]) => (
                <div key={title} className="home-glass-card p-5">
                  <h3 className="home-title font-[family-name:var(--font-display)] text-xl font-bold">
                    {title}
                  </h3>
                  <p className="home-muted mt-3 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-glass-section px-5 py-16 md:px-8 md:py-20">
          <div className="home-glass-panel mx-auto max-w-6xl p-6 md:p-8">
            <h2 className="home-title font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              {t.bloodSafetyTitle}
            </h2>
            <p className="home-muted mt-4 max-w-3xl text-base leading-relaxed">
              {t.bloodSafetyIntro}
            </p>
            <ol className="home-muted mt-8 max-w-3xl list-decimal space-y-4 pl-5 text-base leading-relaxed">
              <li>{t.bloodSafety1}</li>
              <li>{t.bloodSafety2}</li>
              <li>{t.bloodSafety3}</li>
              <li>{t.bloodSafety4}</li>
              <li>{t.bloodSafety5}</li>
            </ol>
          </div>
        </section>

        <section id="about" className="home-glass-section px-5 py-16 md:px-8 md:py-20">
          <div className="home-glass-panel mx-auto max-w-6xl p-6 md:p-8">
            <AboutContent compact immersive />
          </div>
        </section>

        <section id="warnings" className="home-glass-section px-5 py-14 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <SafetyWarnings immersive />
          </div>
        </section>

        <OrgBanners page="home" placement="before-footer" immersive />
        <SiteFooter immersive showStoryForm />
      </div>
    </div>
  );
}
