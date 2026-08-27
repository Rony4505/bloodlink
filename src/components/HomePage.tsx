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
import { loadLoggedIn } from "@/lib/session-me-client";

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
  const {
    brand,
    tagline,
    heroSupport,
    logoUrl,
    heroBackgroundUrl,
  } = useSiteAppearance();
  const [loggedIn, setLoggedIn] = useState(false);
  const isLocalLogo =
    logoUrl.startsWith("/") && !logoUrl.startsWith("/api/");

  useEffect(() => {
    const ctrl = new AbortController();
    void loadLoggedIn().then((ok) => {
      if (!ctrl.signal.aborted) setLoggedIn(ok);
    });
    return () => ctrl.abort();
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <DailyReminder enabled={loggedIn} />
      {loggedIn ? <DonorPushEnableGate /> : null}
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div className="absolute inset-0 bg-[#1c0a0c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackgroundUrl}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(28,10,12,0.78),rgba(110,18,32,0.55))]" />
        </div>
        <div className="hero-orb pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(214,69,80,0.55),transparent_70%)] blur-2xl" />
        <div className="hero-drift pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] blur-2xl" />
        <Header />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24">
          <div className="animate-rise flex items-center gap-4 md:gap-5">
            {isLocalLogo ? (
              <Image
                src={logoUrl}
                alt={brand}
                width={88}
                height={88}
                priority
                className="h-16 w-16 rounded-full bg-white/95 object-cover shadow-lg md:h-[88px] md:w-[88px]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brand}
                className="h-16 w-16 rounded-full bg-white/95 object-cover shadow-lg md:h-[88px] md:w-[88px]"
                decoding="async"
              />
            )}
            <p className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight drop-shadow md:text-7xl">
              {brand}
            </p>
          </div>
          <h1 className="animate-rise-delay mt-4 max-w-2xl text-2xl font-medium leading-snug md:text-3xl">
            {tagline}
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {heroSupport}
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/find" className="btn-primary">
              {t.findDonors}
            </Link>
            <Link href="/register" className="btn-secondary">
              {t.becomeDonor}
            </Link>
            <Link href="/requests" className="btn-secondary">
              {t.requestBlood}
            </Link>
          </div>
          <HomeDonorTotals />
        </div>
      </section>

      <OrgBanners page="home" placement="after-hero" />

      <HomeEmergencyPosts />

      <HomeImpact />

      <HomeDonors />

      <HomeBloodGroupStats />

      <section className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
            {t.howItWorks}
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              [t.how1Title, t.how1Body],
              [t.how2Title, t.how2Body],
              [t.how3Title, t.how3Body],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                  {title}
                </h3>
                <p className="mt-3 leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,white)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
            {t.bloodSafetyTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)]">
            {t.bloodSafetyIntro}
          </p>
          <ol className="mt-8 max-w-3xl list-decimal space-y-4 pl-5 text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_78%,white)]">
            <li>{t.bloodSafety1}</li>
            <li>{t.bloodSafety2}</li>
            <li>{t.bloodSafety3}</li>
            <li>{t.bloodSafety4}</li>
            <li>{t.bloodSafety5}</li>
          </ol>
        </div>
      </section>

      <section
        id="about"
        className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_28%,white)] px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <AboutContent compact />
        </div>
      </section>

      <section
        id="warnings"
        className="border-t border-[var(--line)] bg-white px-5 py-14 md:px-8 md:py-16"
      >
        <div className="mx-auto max-w-6xl">
          <SafetyWarnings />
        </div>
      </section>

      <OrgBanners page="home" placement="before-footer" />
      <SiteFooter />
    </div>
  );
}
