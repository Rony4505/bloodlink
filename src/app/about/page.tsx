import type { Metadata } from "next";
import { FashionShell } from "@/components/fashion/FashionShell";
import { getStoreSettings } from "@/lib/fashion/store";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: settings.aboutTitle || "Our Story",
    description: settings.aboutText || settings.metaDescription,
  };
}

export default async function AboutPage() {
  const settings = await getStoreSettings();
  const pillars = settings.aboutPillars?.length
    ? settings.aboutPillars
    : [
        {
          title: "Curated, not crowded",
          body: "আমরা quantity-র চেয়ে quality, fabric feel, এবং styling clarity-তে focus করি।",
        },
        {
          title: "Bangladesh-first service",
          body: "COD, bKash, Nagad, Dhaka fast delivery, এবং nationwide courier support standard।",
        },
        {
          title: "Women-first experience",
          body: "Size guidance, styling help, festive packaging, এবং thoughtful post-purchase care।",
        },
      ];

  return (
    <FashionShell>
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#9b7766]">
            {settings.aboutSubtitle || "Our story"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold md:text-6xl">
            {settings.aboutTitle || "Luxury that feels natural for Bangladeshi women"}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#6e5449]">
            {settings.aboutText ||
              "Slowgun শুরু হয়েছিল একটি সহজ বিশ্বাস থেকে—premium fashion-এর experience বাংলাদেশি নারীদের কাছে সহজ ও elegant করে তোলা।"}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[2rem] border border-black/6 bg-white p-7 shadow-[0_24px_80px_rgba(48,27,20,0.06)]"
            >
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
                {pillar.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#6c5247]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>
    </FashionShell>
  );
}
