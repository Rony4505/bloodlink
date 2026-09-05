"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { healthcareCompanyPublicUrl } from "@/lib/healthcare-urls";
import { useLocale } from "@/lib/i18n/locale-context";

export type HealthcareQrBannerCompany = {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  contactPhone?: string;
  district?: string;
  upazila?: string;
};

/**
 * Premium A5 / table-stand reception placard.
 * Unique QR opens this institution's public healthcare booking page.
 */
export function HealthcareQrBanner({
  company,
  autoPrint = false,
}: {
  company: HealthcareQrBannerCompany;
  autoPrint?: boolean;
}) {
  const { t, locale } = useLocale();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [ready, setReady] = useState(false);

  const scanUrl = useMemo(
    () => healthcareCompanyPublicUrl(company.slug || company.id),
    [company.id, company.slug],
  );

  const displayName =
    locale === "bn" && company.nameBn?.trim()
      ? company.nameBn.trim()
      : company.name;
  const secondaryName =
    locale === "bn" && company.nameBn?.trim() && company.name !== company.nameBn
      ? company.name
      : company.nameBn?.trim() && company.nameBn !== company.name
        ? company.nameBn
        : "";

  const placeLine = [company.upazila, company.district].filter(Boolean).join(" · ");

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(scanUrl, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#5a101c", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [scanUrl]);

  useEffect(() => {
    if (!autoPrint || !ready || !qrDataUrl) return;
    const timer = window.setTimeout(() => window.print(), 450);
    return () => window.clearTimeout(timer);
  }, [autoPrint, ready, qrDataUrl]);

  return (
    <div className="healthcare-qr-print-root mx-auto flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[color-mix(in_oklab,#f4ebe6_80%,white)] p-4 print:min-h-0 print:bg-white print:p-0">
      <div className="no-print flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => window.print()}>
          {t.healthcareQrPrint}
        </button>
        <a className="btn-ghost px-4 py-2 text-sm" href={scanUrl} target="_blank" rel="noreferrer">
          {t.healthcareQrOpenPage}
        </a>
      </div>

      <article
        className="healthcare-qr-card relative flex w-full max-w-[148mm] flex-col overflow-hidden rounded-[18px] border border-[color-mix(in_oklab,#6e1220_18%,white)] bg-[#fffaf7] shadow-[0_18px_40px_rgba(80,20,28,0.14)] print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        style={{ aspectRatio: "148 / 210" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              "radial-gradient(circle at 12% 8%, rgba(214,69,80,0.16), transparent 42%), radial-gradient(circle at 88% 0%, rgba(110,18,32,0.12), transparent 36%), linear-gradient(165deg, #fffaf7 0%, #f7ece6 55%, #f3e2da 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-3 rounded-[14px] border border-[color-mix(in_oklab,#6e1220_14%,white)] print:inset-[4mm]"
          aria-hidden
        />

        <header className="relative z-[1] flex items-center gap-3 px-6 pb-2 pt-6 print:px-[10mm] print:pt-[9mm]">
          <Image
            src="/bloodlink-logo.png"
            alt="BloodLink"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full bg-white object-contain shadow-sm ring-1 ring-[color-mix(in_oklab,#6e1220_16%,white)]"
            priority
          />
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-wide text-[var(--blood-deep)]">
              BloodLink BD
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color-mix(in_oklab,var(--blood)_72%,#3d1a1f)]">
              {t.healthcareQrEyebrow}
            </p>
          </div>
        </header>

        <div className="relative z-[1] flex flex-1 flex-col items-center px-6 pb-5 pt-3 text-center print:px-[10mm] print:pb-[8mm]">
          <h1 className="max-w-[92%] font-[family-name:var(--font-body)] text-[1.35rem] font-bold leading-snug text-[var(--ink)] print:text-[18pt]">
            {displayName}
          </h1>
          {secondaryName ? (
            <p className="mt-1 max-w-[92%] text-[12px] leading-snug text-[color-mix(in_oklab,var(--ink)_58%,white)] print:text-[9pt]">
              {secondaryName}
            </p>
          ) : null}
          {placeLine ? (
            <p className="mt-2 text-[11px] text-[color-mix(in_oklab,var(--ink)_52%,white)] print:text-[8.5pt]">
              {placeLine}
            </p>
          ) : null}

          <div className="mt-4 flex flex-1 flex-col items-center justify-center">
            <div className="rounded-[16px] bg-white p-3 shadow-[0_10px_28px_rgba(90,16,28,0.12)] ring-1 ring-[color-mix(in_oklab,#6e1220_12%,white)]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={t.healthcareQrAlt}
                  width={220}
                  height={220}
                  className="h-[210px] w-[210px] print:h-[62mm] print:w-[62mm]"
                />
              ) : (
                <div className="flex h-[210px] w-[210px] items-center justify-center text-xs text-[color-mix(in_oklab,var(--ink)_45%,white)] print:h-[62mm] print:w-[62mm]">
                  {t.loading}
                </div>
              )}
            </div>
            <p className="mt-4 max-w-[26ch] text-[13px] font-semibold leading-snug text-[var(--blood-deep)] print:mt-[5mm] print:text-[10.5pt]">
              {t.healthcareQrScanHint}
            </p>
            <p className="mt-1.5 max-w-[30ch] text-[11px] leading-snug text-[color-mix(in_oklab,var(--ink)_55%,white)] print:text-[8pt]">
              {t.healthcareQrScanSub}
            </p>
          </div>

          <footer className="mt-auto w-full border-t border-[color-mix(in_oklab,#6e1220_12%,white)] pt-3 print:pt-[4mm]">
            {company.contactPhone ? (
              <p className="text-[11px] text-[color-mix(in_oklab,var(--ink)_62%,white)] print:text-[8pt]">
                {t.healthcareCompanyPhone}: {company.contactPhone}
              </p>
            ) : null}
            <p className="mt-1 font-[family-name:var(--font-display)] text-[11px] font-bold tracking-wide text-[var(--blood-deep)] print:text-[8.5pt]">
              bloodlinkbd.org
            </p>
            <p className="mt-0.5 break-all text-[9px] text-[color-mix(in_oklab,var(--ink)_42%,white)] print:text-[6.5pt]">
              {scanUrl.replace(/^https?:\/\//, "")}
            </p>
          </footer>
        </div>
      </article>

      <p className="no-print max-w-sm text-center text-xs text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {t.healthcareQrPrintHint}
      </p>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A5 portrait; margin: 0; }
          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * { visibility: hidden; }
          .healthcare-qr-print-root,
          .healthcare-qr-print-root * { visibility: visible; }
          .healthcare-qr-print-root {
            position: absolute;
            inset: 0;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: block !important;
            min-height: 0 !important;
          }
          .no-print { display: none !important; }
          .healthcare-qr-card {
            width: 148mm !important;
            height: 210mm !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
