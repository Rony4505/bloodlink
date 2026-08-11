"use client";

import { useState } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import type {
  AboutPillar,
  FaqItem,
  StoreSettings,
  TestimonialItem,
} from "@/lib/fashion/types";

type SettingsTab =
  | "brand"
  | "hero"
  | "contact"
  | "about"
  | "home"
  | "pricing"
  | "seo"
  | "sizes";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#9b7766]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-black/6 bg-white/70 px-4 py-3">
      <span className="text-sm text-[#3d2a24]">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-[#8b6456]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsEditor({
  settings,
  setSettings,
  onSave,
  newSize,
  setNewSize,
  onAddSize,
  onRemoveSize,
}: {
  settings: StoreSettings;
  setSettings: (next: StoreSettings) => void;
  onSave: () => void;
  newSize: string;
  setNewSize: (v: string) => void;
  onAddSize: () => void;
  onRemoveSize: (size: string) => void;
}) {
  const { fc } = useFashionCopy();
  const [tab, setTab] = useState<SettingsTab>("brand");

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "brand", label: fc.admin.settingsBrand },
    { id: "hero", label: fc.admin.settingsHero },
    { id: "contact", label: fc.admin.settingsContact },
    { id: "about", label: fc.admin.settingsAbout },
    { id: "home", label: fc.admin.settingsHome },
    { id: "pricing", label: fc.admin.settingsPricing },
    { id: "seo", label: fc.admin.settingsSeo },
    { id: "sizes", label: fc.admin.settingsSizes },
  ];

  function patch<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings({ ...settings, [key]: value });
  }

  function updatePillar(index: number, key: keyof AboutPillar, value: string) {
    const pillars = [...(settings.aboutPillars ?? [])];
    pillars[index] = { ...pillars[index], [key]: value };
    patch("aboutPillars", pillars);
  }

  function updateHighlight(index: number, value: string) {
    const items = [...(settings.serviceHighlights ?? [])];
    items[index] = value;
    patch("serviceHighlights", items);
  }

  function updateTestimonial(index: number, key: keyof TestimonialItem, value: string) {
    const items = [...(settings.testimonials ?? [])];
    items[index] = { ...items[index], [key]: value };
    patch("testimonials", items);
  }

  function updateFaq(index: number, key: keyof FaqItem, value: string) {
    const items = [...(settings.faqs ?? [])];
    items[index] = { ...items[index], [key]: value };
    patch("faqs", items);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#7a5c50]">
        ওয়েবসাইটের ব্র্যান্ড, হিরো, যোগাযোগ, অ্যাবাউট, হোমপেজ সেকশন, প্রাইসিং ও SEO — সব এখান থেকে এডিট করুন।
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-[#2b1d19] text-white"
                : "bg-white/70 text-[#5b4339] hover:bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "brand" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brand name">
            <input
              className="field"
              value={settings.brandName}
              onChange={(e) => patch("brandName", e.target.value)}
            />
          </Field>
          <Field label="Brand tagline">
            <input
              className="field"
              value={settings.brandTagline}
              onChange={(e) => patch("brandTagline", e.target.value)}
            />
          </Field>
          <Field label="Announcement bar">
            <input
              className="field"
              value={settings.announcementText ?? ""}
              onChange={(e) => patch("announcementText", e.target.value)}
              placeholder="হোমপেজের উপরে দেখানো মেসেজ"
            />
          </Field>
          <div className="flex items-end">
            <Toggle
              label="Announcement দেখাও"
              checked={Boolean(settings.announcementEnabled)}
              onChange={(v) => patch("announcementEnabled", v)}
            />
          </div>
          <Field label="Free shipping note">
            <input
              className="field"
              value={settings.freeShippingNote ?? ""}
              onChange={(e) => patch("freeShippingNote", e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {tab === "hero" ? (
        <div className="space-y-3">
          <Field label="Hero subtitle">
            <input
              className="field"
              value={settings.heroSubtitle ?? ""}
              onChange={(e) => patch("heroSubtitle", e.target.value)}
            />
          </Field>
          <Field label="Hero title">
            <textarea
              className="field min-h-[70px]"
              value={settings.heroTitle ?? ""}
              onChange={(e) => patch("heroTitle", e.target.value)}
            />
          </Field>
          <Field label="Hero description">
            <textarea
              className="field min-h-[90px]"
              value={settings.heroDescription ?? ""}
              onChange={(e) => patch("heroDescription", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary CTA label">
              <input
                className="field"
                value={settings.heroCtaPrimaryLabel ?? ""}
                onChange={(e) => patch("heroCtaPrimaryLabel", e.target.value)}
              />
            </Field>
            <Field label="Primary CTA link">
              <input
                className="field"
                value={settings.heroCtaPrimaryHref ?? ""}
                onChange={(e) => patch("heroCtaPrimaryHref", e.target.value)}
              />
            </Field>
            <Field label="Secondary CTA label">
              <input
                className="field"
                value={settings.heroCtaSecondaryLabel ?? ""}
                onChange={(e) => patch("heroCtaSecondaryLabel", e.target.value)}
              />
            </Field>
            <Field label="Secondary CTA link">
              <input
                className="field"
                value={settings.heroCtaSecondaryHref ?? ""}
                onChange={(e) => patch("heroCtaSecondaryHref", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["heroStat1Value", "heroStat1Label", "Stat 1"],
                ["heroStat2Value", "heroStat2Label", "Stat 2"],
                ["heroStat3Value", "heroStat3Label", "Stat 3"],
              ] as const
            ).map(([valueKey, labelKey, title]) => (
              <div key={title} className="space-y-2 rounded-xl border border-black/6 bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">{title}</p>
                <input
                  className="field"
                  placeholder="Value"
                  value={String(settings[valueKey] ?? "")}
                  onChange={(e) => patch(valueKey, e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Label"
                  value={String(settings[labelKey] ?? "")}
                  onChange={(e) => patch(labelKey, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "contact" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone">
            <input
              className="field"
              value={settings.contactPhone ?? ""}
              onChange={(e) => patch("contactPhone", e.target.value)}
            />
          </Field>
          <Field label="WhatsApp (digits)">
            <input
              className="field"
              value={settings.whatsapp ?? ""}
              onChange={(e) => patch("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className="field"
              value={settings.contactEmail ?? ""}
              onChange={(e) => patch("contactEmail", e.target.value)}
            />
          </Field>
          <Field label="Support note">
            <input
              className="field"
              value={settings.supportNote ?? ""}
              onChange={(e) => patch("supportNote", e.target.value)}
            />
          </Field>
          <Field label="Facebook URL">
            <input
              className="field"
              value={settings.facebookUrl ?? ""}
              onChange={(e) => patch("facebookUrl", e.target.value)}
            />
          </Field>
          <Field label="Instagram URL">
            <input
              className="field"
              value={settings.instagramUrl ?? ""}
              onChange={(e) => patch("instagramUrl", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Footer text">
              <textarea
                className="field min-h-[90px]"
                value={settings.footerText ?? ""}
                onChange={(e) => patch("footerText", e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {tab === "about" ? (
        <div className="space-y-3">
          <Field label="About subtitle">
            <input
              className="field"
              value={settings.aboutSubtitle ?? ""}
              onChange={(e) => patch("aboutSubtitle", e.target.value)}
            />
          </Field>
          <Field label="About title">
            <input
              className="field"
              value={settings.aboutTitle ?? ""}
              onChange={(e) => patch("aboutTitle", e.target.value)}
            />
          </Field>
          <Field label="About body">
            <textarea
              className="field min-h-[100px]"
              value={settings.aboutText ?? ""}
              onChange={(e) => patch("aboutText", e.target.value)}
            />
          </Field>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">Pillars</p>
            {(settings.aboutPillars ?? []).map((pillar, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-black/6 bg-white/60 p-3 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="Title"
                  value={pillar.title}
                  onChange={(e) => updatePillar(index, "title", e.target.value)}
                />
                <textarea
                  className="field min-h-[70px] sm:col-span-2"
                  placeholder="Body"
                  value={pillar.body}
                  onChange={(e) => updatePillar(index, "body", e.target.value)}
                />
              </div>
            ))}
            <FashionButton
              variant="secondary"
              onClick={() =>
                patch("aboutPillars", [
                  ...(settings.aboutPillars ?? []),
                  { title: "New pillar", body: "" },
                ])
              }
            >
              + Pillar
            </FashionButton>
          </div>
        </div>
      ) : null}

      {tab === "home" ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Homepage-এ কুপন দেখাও"
              checked={settings.showCouponsOnHome !== false}
              onChange={(v) => patch("showCouponsOnHome", v)}
            />
            <Toggle
              label="New products সেকশন"
              checked={settings.showNewProducts !== false}
              onChange={(v) => patch("showNewProducts", v)}
            />
            <Toggle
              label="Offers সেকশন"
              checked={settings.showOffers !== false}
              onChange={(v) => patch("showOffers", v)}
            />
            <Toggle
              label="Features সেকশন"
              checked={settings.showFeatures !== false}
              onChange={(v) => patch("showFeatures", v)}
            />
            <Toggle
              label="Testimonials সেকশন"
              checked={settings.showTestimonials !== false}
              onChange={(v) => patch("showTestimonials", v)}
            />
            <Toggle
              label="FAQ সেকশন"
              checked={settings.showFaq !== false}
              onChange={(v) => patch("showFaq", v)}
            />
          </div>

          <Field label="Features title">
            <input
              className="field"
              value={settings.featuresTitle ?? ""}
              onChange={(e) => patch("featuresTitle", e.target.value)}
            />
          </Field>
          <Field label="Features body">
            <textarea
              className="field min-h-[80px]"
              value={settings.featuresBody ?? ""}
              onChange={(e) => patch("featuresBody", e.target.value)}
            />
          </Field>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
              Service highlights
            </p>
            {(settings.serviceHighlights ?? []).map((item, index) => (
              <input
                key={index}
                className="field"
                value={item}
                onChange={(e) => updateHighlight(index, e.target.value)}
              />
            ))}
            <FashionButton
              variant="secondary"
              onClick={() =>
                patch("serviceHighlights", [...(settings.serviceHighlights ?? []), ""])
              }
            >
              + Highlight
            </FashionButton>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
              Testimonials
            </p>
            {(settings.testimonials ?? []).map((item, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-black/6 bg-white/60 p-3">
                <textarea
                  className="field min-h-[70px]"
                  value={item.quote}
                  onChange={(e) => updateTestimonial(index, "quote", e.target.value)}
                />
                <input
                  className="field"
                  value={item.author}
                  onChange={(e) => updateTestimonial(index, "author", e.target.value)}
                />
              </div>
            ))}
            <FashionButton
              variant="secondary"
              onClick={() =>
                patch("testimonials", [
                  ...(settings.testimonials ?? []),
                  { quote: "", author: "" },
                ])
              }
            >
              + Testimonial
            </FashionButton>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">FAQ</p>
            {(settings.faqs ?? []).map((item, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-black/6 bg-white/60 p-3">
                <input
                  className="field"
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => updateFaq(index, "question", e.target.value)}
                />
                <textarea
                  className="field min-h-[70px]"
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) => updateFaq(index, "answer", e.target.value)}
                />
              </div>
            ))}
            <FashionButton
              variant="secondary"
              onClick={() =>
                patch("faqs", [...(settings.faqs ?? []), { question: "", answer: "" }])
              }
            >
              + FAQ
            </FashionButton>
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Default pricing mode">
            <select
              className="field"
              value={settings.pricingMode}
              onChange={(e) =>
                patch("pricingMode", e.target.value as StoreSettings["pricingMode"])
              }
            >
              <option value="markup">Markup %</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <Field label="Default markup %">
            <input
              className="field"
              type="number"
              min={0}
              value={settings.defaultMarkupPercent}
              onChange={(e) => patch("defaultMarkupPercent", Number(e.target.value) || 0)}
            />
          </Field>
          <p className="sm:col-span-2 text-sm text-[#7a5c50]">
            ডেলিভারি ফি আলাদা মেনুতে (Delivery) এডিট করুন। কুপন ও অফারও আলাদা মেনুতে আছে।
          </p>
        </div>
      ) : null}

      {tab === "seo" ? (
        <div className="space-y-3">
          <Field label="Meta title">
            <input
              className="field"
              value={settings.metaTitle ?? ""}
              onChange={(e) => patch("metaTitle", e.target.value)}
            />
          </Field>
          <Field label="Meta description">
            <textarea
              className="field min-h-[90px]"
              value={settings.metaDescription ?? ""}
              onChange={(e) => patch("metaDescription", e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {tab === "sizes" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="নতুন সাইজ (যেমন XXL)"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
            />
            <FashionButton variant="secondary" onClick={onAddSize}>
              যোগ
            </FashionButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {(settings.availableSizes ?? []).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onRemoveSize(size)}
                className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-sm text-[#5b4339]"
              >
                {size} ×
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-0 border-t border-black/5 bg-white/80 pt-4 backdrop-blur">
        <FashionButton onClick={onSave}>{fc.admin.settingsSaveAll}</FashionButton>
      </div>
    </div>
  );
}
