"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DailyReminder } from "@/components/DailyReminder";
import { Header } from "@/components/Header";
import { HomeDonors } from "@/components/HomeDonors";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/lib/i18n/locale-context";

export function HomePage() {
  const { t } = useLocale();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.donor)))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <DailyReminder enabled={loggedIn} />
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(28,10,12,0.78), rgba(110,18,32,0.55)), url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="hero-orb pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(214,69,80,0.55),transparent_70%)] blur-2xl" />
        <div className="hero-drift pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_70%)] blur-2xl" />
        <Header />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight drop-shadow md:text-7xl">
            {t.brand}
          </p>
          <h1 className="animate-rise-delay mt-4 max-w-2xl text-2xl font-medium leading-snug md:text-3xl">
            {t.tagline}
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {t.heroSupport}
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
        </div>
      </section>

      <HomeDonors />

      <section className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_20%,white)] px-5 py-20 md:px-8">
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

      <section
        id="about"
        className="border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--sand)_28%,white)] px-5 py-20 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--blood-deep)] md:text-4xl">
            {t.aboutTitle}
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_75%,white)]">
            {t.aboutBody}
          </p>
          <div className="mt-8 space-y-2 text-sm md:text-base">
            <p>
              <span className="font-semibold">{t.createdBy}:</span> {t.creatorName}
            </p>
            <p>
              <span className="font-semibold">{t.contactNumber}:</span>{" "}
              <a
                href="tel:+8801711934505"
                className="text-[var(--blood-deep)] underline-offset-4 hover:underline"
              >
                {t.creatorPhone}
              </a>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
