"use client";

import { useEffect, useState } from "react";
import { FashionButton } from "@/components/fashion/FashionButton";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import type {
  AboutPillar,
  FaqItem,
  StoreSettings,
} from "@/lib/fashion/types";

type SettingsTab =
  | "brand"
  | "hero"
  | "contact"
  | "about"
  | "home"
  | "pricing"
  | "seo"
  | "sizes"
  | "backup";

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

function DualText({
  label,
  bn,
  en,
  onBn,
  onEn,
  multiline = false,
}: {
  label: string;
  bn: string;
  en: string;
  onBn: (v: string) => void;
  onEn: (v: string) => void;
  multiline?: boolean;
}) {
  const { fc } = useFashionCopy();
  return (
    <div className="space-y-2 rounded-xl border border-black/6 bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold text-[#8f624e]">{fc.admin.bangla}</span>
          {multiline ? (
            <textarea className="field mt-1 min-h-[80px]" value={bn} onChange={(e) => onBn(e.target.value)} />
          ) : (
            <input className="field mt-1" value={bn} onChange={(e) => onBn(e.target.value)} />
          )}
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-[#8f624e]">{fc.admin.english}</span>
          {multiline ? (
            <textarea className="field mt-1 min-h-[80px]" value={en} onChange={(e) => onEn(e.target.value)} />
          ) : (
            <input className="field mt-1" value={en} onChange={(e) => onEn(e.target.value)} />
          )}
        </label>
      </div>
    </div>
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
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [storageSaving, setStorageSaving] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    backend?: string;
    activeHost?: string;
    postgresError?: string | null;
    productCount?: number | null;
    databaseUrlConfigured?: boolean;
    activeUrlSource?: string;
    activeUrlIsPrivate?: boolean;
  } | null>(null);

  function postgresHostFromInput(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    try {
      const u = new URL(trimmed.replace(/^postgres(ql)?:/i, "http:"));
      return u.hostname || "";
    } catch {
      return "";
    }
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "brand", label: fc.admin.settingsBrand },
    { id: "hero", label: fc.admin.settingsHero },
    { id: "contact", label: fc.admin.settingsContact },
    { id: "about", label: fc.admin.settingsAbout },
    { id: "home", label: fc.admin.settingsHome },
    { id: "pricing", label: fc.admin.settingsPricing },
    { id: "seo", label: fc.admin.settingsSeo },
    { id: "sizes", label: fc.admin.settingsSizes },
    { id: "backup", label: fc.admin.settingsBackup },
  ];

  async function downloadBackup() {
    setBackupMessage("");
    try {
      const res = await fetch("/api/fashion/backup");
      if (!res.ok) {
        setBackupMessage(fc.admin.backupRestoreFailed);
        return;
      }
      const blob = await res.blob();
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `smartcraft-backup-${stamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setBackupMessage(fc.admin.backupDownload);
    } catch {
      setBackupMessage(fc.admin.backupRestoreFailed);
    }
  }

  async function loadStorageStatus() {
    setStorageLoading(true);
    try {
      const res = await fetch("/api/fashion/admin/storage");
      const data = await res.json();
      setDatabaseReady(Boolean(data.databaseReady));
      setStorageStatus({
        backend: data.backend ?? data.storage?.backend,
        activeHost: data.activeHost ?? data.storage?.postgresHost ?? "",
        postgresError: data.postgresError ?? data.storage?.postgresError ?? null,
        productCount: data.productCount ?? data.storage?.productCount ?? null,
        databaseUrlConfigured: Boolean(data.databaseUrlConfigured ?? data.savedUrlOnVolume),
        activeUrlSource: data.activeUrlSource,
        activeUrlIsPrivate: Boolean(data.activeUrlIsPrivate),
      });
    } catch {
      setDatabaseReady(false);
      setStorageStatus({
        backend: "unknown",
        postgresError: fc.admin.postgresSaveFailed,
        databaseUrlConfigured: false,
      });
    } finally {
      setStorageLoading(false);
    }
  }

  async function saveDatabaseStorage(e: React.FormEvent) {
    e.preventDefault();
    if (!databaseUrl.trim()) return;
    setStorageSaving(true);
    setBackupMessage("");
    try {
      const res = await fetch("/api/fashion/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || fc.admin.postgresSaveFailed;
        setBackupMessage(errMsg);
        setDatabaseReady(Boolean(data.databaseReady));
        setStorageStatus({
          backend: data.backend ?? data.storage?.backend ?? "file-fallback",
          postgresError: data.postgresError ?? errMsg,
          activeHost: data.activeHost ?? data.storage?.postgresHost ?? "",
          productCount: data.storage?.productCount ?? null,
          databaseUrlConfigured: Boolean(data.databaseUrlConfigured ?? data.savedUrlOnVolume),
          activeUrlSource: data.activeUrlSource,
          activeUrlIsPrivate: Boolean(data.activeUrlIsPrivate),
        });
        return;
      }
      setDatabaseReady(Boolean(data.databaseReady));
      setStorageStatus({
        backend: data.storage?.backend ?? (data.databaseReady ? "postgres" : "file"),
        activeHost: data.activeHost ?? "",
        postgresError: data.error ?? null,
        productCount: data.productCount ?? data.storage?.productCount ?? null,
        databaseUrlConfigured: true,
      });
      setBackupMessage(
        data.databaseReady
          ? `${fc.admin.postgresSaveSuccess} (${data.productCount ?? 0} products)`
          : data.error || fc.admin.postgresSaveFailed,
      );
      if (data.databaseReady) setDatabaseUrl("");
    } catch {
      setBackupMessage(fc.admin.postgresSaveFailed);
    } finally {
      setStorageSaving(false);
    }
  }

  async function restoreBackup(e: React.FormEvent) {
    e.preventDefault();
    if (!backupFile) return;
    if (!window.confirm(fc.admin.backupRestoreConfirm)) return;
    setBackupRestoring(true);
    setBackupMessage("");
    try {
      const text = await backupFile.text();
      const payload = JSON.parse(text);
      const res = await fetch("/api/fashion/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setBackupMessage(data.error || fc.admin.backupRestoreFailed);
        return;
      }
      setBackupMessage(
        `${fc.admin.backupRestoreSuccess} (${data.productCount ?? 0} products, ${data.orderCount ?? 0} orders)`,
      );
      setBackupFile(null);
    } catch {
      setBackupMessage(fc.admin.backupRestoreFailed);
    } finally {
      setBackupRestoring(false);
    }
  }

  function patch<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings({ ...settings, [key]: value });
  }

  useEffect(() => {
    if (tab !== "backup") return;
    void loadStorageStatus();
  }, [tab]);

  const pastedHost = postgresHostFromInput(databaseUrl);
  const activeHost = storageStatus?.activeHost ?? "";
  const pasteDiffersFromActive =
    pastedHost.length > 0 && pastedHost.toLowerCase() !== activeHost.toLowerCase();
  const pastedIsInternal = /railway\.internal/i.test(databaseUrl);

  const postgresBanner = (() => {
    if (storageLoading) {
      return {
        tone: "neutral" as const,
        title: fc.admin.postgresStatusChecking,
        detail: "",
      };
    }
    if (pastedIsInternal) {
      return {
        tone: "error" as const,
        title: fc.admin.postgresRejectInternal,
        detail: fc.admin.postgresInvalidUrlHint,
      };
    }
    if (pasteDiffersFromActive) {
      return {
        tone: "warn" as const,
        title: fc.admin.postgresStatusPasteUntested,
        detail: activeHost
          ? `${fc.admin.postgresStatusHost}: ${activeHost}${databaseReady ? " (connected)" : ""}`
          : fc.admin.postgresInvalidUrlHint,
      };
    }
    if (databaseReady) {
      return {
        tone: "ok" as const,
        title: fc.admin.postgresStatusConnected,
        detail: [
          storageStatus?.activeHost ? `${fc.admin.postgresStatusHost}: ${storageStatus.activeHost}` : "",
          storageStatus?.productCount != null
            ? `${fc.admin.postgresStatusProducts}: ${storageStatus.productCount}`
            : "",
          storageStatus?.activeUrlSource
            ? `${fc.admin.postgresStatusActiveSource}: ${storageStatus.activeUrlSource}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }
    if (storageStatus?.activeUrlIsPrivate) {
      return {
        tone: "warn" as const,
        title: fc.admin.postgresRejectInternal,
        detail: storageStatus.postgresError || fc.admin.postgresInvalidUrlHint,
      };
    }
    if (storageStatus?.backend === "file-fallback" || storageStatus?.postgresError) {
      return {
        tone: "error" as const,
        title: fc.admin.postgresStatusFailed,
        detail: storageStatus.postgresError || fc.admin.postgresStatusFallback,
      };
    }
    if (storageStatus?.databaseUrlConfigured) {
      return {
        tone: "error" as const,
        title: fc.admin.postgresStatusFailed,
        detail: storageStatus.postgresError || fc.admin.postgresInvalidUrlHint,
      };
    }
    return {
      tone: "warn" as const,
      title: fc.admin.postgresStatusNotConfigured,
      detail: fc.admin.postgresInvalidUrlHint,
    };
  })();

  function updatePillar(index: number, key: keyof AboutPillar, value: string, lang: "bn" | "en") {
    if (lang === "en") {
      const pillars = [...(settings.aboutPillarsEn ?? settings.aboutPillars ?? [])];
      while (pillars.length <= index) pillars.push({ title: "", body: "" });
      pillars[index] = { ...pillars[index], [key]: value };
      patch("aboutPillarsEn", pillars);
      return;
    }
    const pillars = [...(settings.aboutPillars ?? [])];
    pillars[index] = { ...pillars[index], [key]: value };
    patch("aboutPillars", pillars);
  }

  function updateHighlight(index: number, value: string, lang: "bn" | "en") {
    if (lang === "en") {
      const items = [...(settings.serviceHighlightsEn ?? [])];
      while (items.length <= index) items.push("");
      items[index] = value;
      patch("serviceHighlightsEn", items);
      return;
    }
    const items = [...(settings.serviceHighlights ?? [])];
    items[index] = value;
    patch("serviceHighlights", items);
  }

  function updateFaq(index: number, key: keyof FaqItem, value: string, lang: "bn" | "en") {
    if (lang === "en") {
      const items = [...(settings.faqsEn ?? [])];
      while (items.length <= index) items.push({ question: "", answer: "" });
      items[index] = { ...items[index], [key]: value };
      patch("faqsEn", items);
      return;
    }
    const items = [...(settings.faqs ?? [])];
    items[index] = { ...items[index], [key]: value };
    patch("faqs", items);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[#7a5c50]">{fc.admin.settingsIntro}</p>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-[#2b1d19] text-white"
                : "border border-[#c9a890] bg-[#f3ebe4] text-[#1c1412] hover:bg-[#ebe0d6]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "brand" ? (
        <div className="space-y-3">
          <Field label={fc.admin.settingsBrandName}>
            <input
              className="field"
              value={settings.brandName}
              onChange={(e) => patch("brandName", e.target.value)}
            />
          </Field>
          <DualText
            label={fc.admin.settingsTagline}
            bn={settings.brandTagline}
            en={settings.brandTaglineEn ?? ""}
            onBn={(v) => patch("brandTagline", v)}
            onEn={(v) => patch("brandTaglineEn", v)}
          />
          <DualText
            label={fc.admin.settingsAnnouncement}
            bn={settings.announcementText ?? ""}
            en={settings.announcementTextEn ?? ""}
            onBn={(v) => patch("announcementText", v)}
            onEn={(v) => patch("announcementTextEn", v)}
          />
          <Toggle
            label={fc.admin.settingsShowAnnouncement}
            checked={Boolean(settings.announcementEnabled)}
            onChange={(v) => patch("announcementEnabled", v)}
          />
          <DualText
            label={fc.admin.settingsFreeShippingNote}
            bn={settings.freeShippingNote ?? ""}
            en={settings.freeShippingNoteEn ?? ""}
            onBn={(v) => patch("freeShippingNote", v)}
            onEn={(v) => patch("freeShippingNoteEn", v)}
          />
        </div>
      ) : null}

      {tab === "hero" ? (
        <div className="space-y-3">
          <DualText
            label={fc.admin.settingsHeroSubtitle}
            bn={settings.heroSubtitle ?? ""}
            en={settings.heroSubtitleEn ?? ""}
            onBn={(v) => patch("heroSubtitle", v)}
            onEn={(v) => patch("heroSubtitleEn", v)}
          />
          <DualText
            label={fc.admin.settingsHeroTitle}
            bn={settings.heroTitle ?? ""}
            en={settings.heroTitleEn ?? ""}
            onBn={(v) => patch("heroTitle", v)}
            onEn={(v) => patch("heroTitleEn", v)}
            multiline
          />
          <DualText
            label={fc.admin.settingsHeroDescription}
            bn={settings.heroDescription ?? ""}
            en={settings.heroDescriptionEn ?? ""}
            onBn={(v) => patch("heroDescription", v)}
            onEn={(v) => patch("heroDescriptionEn", v)}
            multiline
          />
          <DualText
            label={fc.admin.settingsPrimaryCta}
            bn={settings.heroCtaPrimaryLabel ?? ""}
            en={settings.heroCtaPrimaryLabelEn ?? ""}
            onBn={(v) => patch("heroCtaPrimaryLabel", v)}
            onEn={(v) => patch("heroCtaPrimaryLabelEn", v)}
          />
          <Field label={fc.admin.settingsPrimaryCtaLink}>
            <input
              className="field"
              value={settings.heroCtaPrimaryHref ?? ""}
              onChange={(e) => patch("heroCtaPrimaryHref", e.target.value)}
            />
          </Field>
          <DualText
            label={fc.admin.settingsSecondaryCta}
            bn={settings.heroCtaSecondaryLabel ?? ""}
            en={settings.heroCtaSecondaryLabelEn ?? ""}
            onBn={(v) => patch("heroCtaSecondaryLabel", v)}
            onEn={(v) => patch("heroCtaSecondaryLabelEn", v)}
          />
          <Field label={fc.admin.settingsSecondaryCtaLink}>
            <input
              className="field"
              value={settings.heroCtaSecondaryHref ?? ""}
              onChange={(e) => patch("heroCtaSecondaryHref", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["heroStat1Value", "heroStat1Label", "heroStat1LabelEn", "Stat 1"],
                ["heroStat2Value", "heroStat2Label", "heroStat2LabelEn", "Stat 2"],
                ["heroStat3Value", "heroStat3Label", "heroStat3LabelEn", "Stat 3"],
              ] as const
            ).map(([valueKey, labelKey, labelEnKey, title]) => (
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
                  placeholder="Label (বাংলা)"
                  value={String(settings[labelKey] ?? "")}
                  onChange={(e) => patch(labelKey, e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Label (English)"
                  value={String(settings[labelEnKey] ?? "")}
                  onChange={(e) => patch(labelEnKey, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "contact" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={fc.admin.settingsPhone}>
            <input
              className="field"
              value={settings.contactPhone ?? ""}
              onChange={(e) => patch("contactPhone", e.target.value)}
            />
          </Field>
          <Field label={fc.admin.settingsWhatsapp}>
            <input
              className="field"
              value={settings.whatsapp ?? ""}
              onChange={(e) => patch("whatsapp", e.target.value)}
            />
          </Field>
          <Field label={fc.admin.settingsEmail}>
            <input
              className="field"
              value={settings.contactEmail ?? ""}
              onChange={(e) => patch("contactEmail", e.target.value)}
            />
          </Field>
          <Field label={fc.admin.settingsFacebook}>
            <input
              className="field"
              value={settings.facebookUrl ?? ""}
              onChange={(e) => patch("facebookUrl", e.target.value)}
            />
          </Field>
          <Field label={fc.admin.settingsInstagram}>
            <input
              className="field"
              value={settings.instagramUrl ?? ""}
              onChange={(e) => patch("instagramUrl", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <DualText
              label={fc.admin.settingsSupportNote}
              bn={settings.supportNote ?? ""}
              en={settings.supportNoteEn ?? ""}
              onBn={(v) => patch("supportNote", v)}
              onEn={(v) => patch("supportNoteEn", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <DualText
              label={fc.admin.settingsFooterText}
              bn={settings.footerText ?? ""}
              en={settings.footerTextEn ?? ""}
              onBn={(v) => patch("footerText", v)}
              onEn={(v) => patch("footerTextEn", v)}
              multiline
            />
          </div>
        </div>
      ) : null}

      {tab === "about" ? (
        <div className="space-y-3">
          <DualText
            label={fc.admin.settingsAboutSubtitle}
            bn={settings.aboutSubtitle ?? ""}
            en={settings.aboutSubtitleEn ?? ""}
            onBn={(v) => patch("aboutSubtitle", v)}
            onEn={(v) => patch("aboutSubtitleEn", v)}
          />
          <DualText
            label={fc.admin.settingsAboutTitle}
            bn={settings.aboutTitle ?? ""}
            en={settings.aboutTitleEn ?? ""}
            onBn={(v) => patch("aboutTitle", v)}
            onEn={(v) => patch("aboutTitleEn", v)}
          />
          <DualText
            label={fc.admin.settingsAboutBody}
            bn={settings.aboutText ?? ""}
            en={settings.aboutTextEn ?? ""}
            onBn={(v) => patch("aboutText", v)}
            onEn={(v) => patch("aboutTextEn", v)}
            multiline
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">Pillars</p>
          {(settings.aboutPillars ?? []).map((pillar, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-black/6 bg-white/60 p-3">
              <DualText
                label={`Pillar ${index + 1} title`}
                bn={pillar.title}
                en={settings.aboutPillarsEn?.[index]?.title ?? ""}
                onBn={(v) => updatePillar(index, "title", v, "bn")}
                onEn={(v) => updatePillar(index, "title", v, "en")}
              />
              <DualText
                label={`Pillar ${index + 1} body`}
                bn={pillar.body}
                en={settings.aboutPillarsEn?.[index]?.body ?? ""}
                onBn={(v) => updatePillar(index, "body", v, "bn")}
                onEn={(v) => updatePillar(index, "body", v, "en")}
                multiline
              />
            </div>
          ))}
        </div>
      ) : null}

      {tab === "home" ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label={fc.admin.settingsShowCoupons}
              checked={settings.showCouponsOnHome !== false}
              onChange={(v) => patch("showCouponsOnHome", v)}
            />
            <Toggle
              label={fc.admin.settingsShowNewProducts}
              checked={settings.showNewProducts !== false}
              onChange={(v) => patch("showNewProducts", v)}
            />
            <Toggle
              label={fc.admin.settingsShowOffers}
              checked={settings.showOffers !== false}
              onChange={(v) => patch("showOffers", v)}
            />
            <Toggle
              label={fc.admin.settingsShowFeatures}
              checked={settings.showFeatures !== false}
              onChange={(v) => patch("showFeatures", v)}
            />
            <Toggle
              label={fc.admin.settingsShowFaq}
              checked={settings.showFaq !== false}
              onChange={(v) => patch("showFaq", v)}
            />
          </div>

          <DualText
            label={fc.admin.settingsFeaturesTitle}
            bn={settings.featuresTitle ?? ""}
            en={settings.featuresTitleEn ?? ""}
            onBn={(v) => patch("featuresTitle", v)}
            onEn={(v) => patch("featuresTitleEn", v)}
          />
          <DualText
            label={fc.admin.settingsFeaturesBody}
            bn={settings.featuresBody ?? ""}
            en={settings.featuresBodyEn ?? ""}
            onBn={(v) => patch("featuresBody", v)}
            onEn={(v) => patch("featuresBodyEn", v)}
            multiline
          />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
              Service highlights
            </p>
            {(settings.serviceHighlights ?? []).map((item, index) => (
              <DualText
                key={index}
                label={`Highlight ${index + 1}`}
                bn={item}
                en={settings.serviceHighlightsEn?.[index] ?? ""}
                onBn={(v) => updateHighlight(index, v, "bn")}
                onEn={(v) => updateHighlight(index, v, "en")}
              />
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">FAQ</p>
            {(settings.faqs ?? []).map((item, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-black/6 bg-white/60 p-3">
                <DualText
                  label={fc.admin.settingsFaqQuestion}
                  bn={item.question}
                  en={settings.faqsEn?.[index]?.question ?? ""}
                  onBn={(v) => updateFaq(index, "question", v, "bn")}
                  onEn={(v) => updateFaq(index, "question", v, "en")}
                />
                <DualText
                  label={fc.admin.settingsFaqAnswer}
                  bn={item.answer}
                  en={settings.faqsEn?.[index]?.answer ?? ""}
                  onBn={(v) => updateFaq(index, "answer", v, "bn")}
                  onEn={(v) => updateFaq(index, "answer", v, "en")}
                  multiline
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={fc.admin.settingsPricingMode}>
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
            <Field label={fc.admin.settingsMarkup}>
              <input
                className="field"
                type="number"
                min={0}
                value={settings.defaultMarkupPercent}
                onChange={(e) => patch("defaultMarkupPercent", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-black/6 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
              Top Buying User (VIP) discount
            </p>
            <Toggle
              label={fc.admin.settingsVipEnabled}
              checked={settings.vipEnabled !== false}
              onChange={(v) => patch("vipEnabled", v)}
            />
            <Field label={fc.admin.settingsVipMinSpend}>
              <input
                className="field"
                type="number"
                min={0}
                value={settings.vipMinSpend ?? 0}
                onChange={(e) => patch("vipMinSpend", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label={fc.admin.settingsVipDiscount}>
              <input
                className="field"
                type="number"
                min={0}
                max={100}
                value={settings.vipDiscountPercent ?? 0}
                onChange={(e) => patch("vipDiscountPercent", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-xl border border-black/6 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7766]">
              Admin login security
            </p>
            <Field label={fc.admin.settingsAdminUsername}>
              <input
                className="field"
                value={settings.adminUsername ?? "founder"}
                onChange={(e) => patch("adminUsername", e.target.value)}
              />
            </Field>
            <Field label={fc.admin.settingsAdminEmail}>
              <input
                className="field"
                type="email"
                value={settings.adminEmail ?? ""}
                onChange={(e) => patch("adminEmail", e.target.value)}
              />
            </Field>
            <Field label={fc.admin.settingsAdminPhone}>
              <input
                className="field"
                value={settings.adminPhone ?? ""}
                onChange={(e) => patch("adminPhone", e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {tab === "seo" ? (
        <div className="space-y-3">
          <DualText
            label={fc.admin.settingsMetaTitle}
            bn={settings.metaTitle ?? ""}
            en={settings.metaTitleEn ?? ""}
            onBn={(v) => patch("metaTitle", v)}
            onEn={(v) => patch("metaTitleEn", v)}
          />
          <DualText
            label={fc.admin.settingsMetaDescription}
            bn={settings.metaDescription ?? ""}
            en={settings.metaDescriptionEn ?? ""}
            onBn={(v) => patch("metaDescription", v)}
            onEn={(v) => patch("metaDescriptionEn", v)}
            multiline
          />
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

      {tab === "backup" ? (
        <div className="space-y-4 rounded-xl border border-black/6 bg-white/70 p-4">
          <div className="space-y-3 rounded-xl border border-[#c9a0b8]/40 bg-[#fff8fc] p-4">
            <p className="text-sm font-semibold text-[#5c3d5e]">{fc.admin.postgresTitle}</p>
            <p className="text-xs leading-relaxed text-[#8a7490]">{fc.admin.postgresBody}</p>

            <div
              className={`rounded-xl border px-4 py-3 ${
                postgresBanner.tone === "ok"
                  ? "border-[#2f6b4f]/30 bg-[#edf7f0] text-[#1e5631]"
                  : postgresBanner.tone === "error"
                    ? "border-red-300 bg-red-50 text-red-800"
                    : postgresBanner.tone === "warn"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-black/10 bg-white/80 text-[#5b4339]"
              }`}
              role="status"
            >
              <p className="text-sm font-semibold">{postgresBanner.title}</p>
              {postgresBanner.detail ? (
                <p className="mt-1 text-xs leading-relaxed opacity-90">{postgresBanner.detail}</p>
              ) : null}
            </div>

            <form onSubmit={saveDatabaseStorage} className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#3d2a24]">{fc.admin.postgresLabel}</span>
                <input
                  className="field font-mono text-xs"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  placeholder="postgresql://user:pass@host:port/railway"
                />
              </label>
              <FashionButton
                type="submit"
                variant="secondary"
                disabled={storageSaving || !databaseUrl.trim() || pastedIsInternal}
              >
                {storageSaving ? "..." : fc.admin.postgresSave}
              </FashionButton>
              <FashionButton type="button" variant="secondary" onClick={() => void loadStorageStatus()}>
                ↻
              </FashionButton>
            </form>
            {backupMessage ? (
              <p
                className={`text-sm font-medium ${
                  databaseReady ? "text-[#2f6b4f]" : "text-red-700"
                }`}
              >
                {backupMessage}
              </p>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-[#5b4339]">{fc.admin.backupBody}</p>
          <p className="text-xs leading-relaxed text-[#9b7766]">{fc.admin.backupRotatingHint}</p>
          <FashionButton type="button" onClick={() => void downloadBackup()}>
            {fc.admin.backupDownload}
          </FashionButton>
          <form onSubmit={restoreBackup} className="space-y-3 border-t border-black/6 pt-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[#3d2a24]">{fc.admin.backupRestoreLabel}</span>
              <input
                className="field"
                type="file"
                accept="application/json,.json"
                onChange={(e) => setBackupFile(e.target.files?.[0] ?? null)}
              />
              <span className="mt-1 block text-xs text-[#9b7766]">{fc.admin.backupRestoreHint}</span>
            </label>
            <FashionButton
              type="submit"
              variant="secondary"
              disabled={backupRestoring || !backupFile}
            >
              {backupRestoring ? "..." : fc.admin.backupRestoreButton}
            </FashionButton>
          </form>
          {backupMessage ? (
            <p className="text-sm font-medium text-[#5c3d5e]">{backupMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
