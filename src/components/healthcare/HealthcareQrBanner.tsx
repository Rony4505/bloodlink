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
 * Print path uses solid colors + black QR so Safari/Chrome match the screen card.
 */
export function HealthcareQrBanner({
  company,
  autoPrint = false,
}: {
  company: HealthcareQrBannerCompany;
  autoPrint?: boolean;
}) {
  const { t, locale } = useLocale();
  const [qrScreen, setQrScreen] = useState("");
  const [qrPrint, setQrPrint] = useState("");
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
    void Promise.all([
      QRCode.toDataURL(scanUrl, {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#5a101c", light: "#ffffff" },
      }),
      QRCode.toDataURL(scanUrl, {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      }),
    ])
      .then(([screen, printQr]) => {
        if (cancelled) return;
        setQrScreen(screen);
        setQrPrint(printQr);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [scanUrl]);

  useEffect(() => {
    document.documentElement.classList.add("healthcare-qr-print-mode");
    document.body.classList.add("healthcare-qr-print-mode");
    return () => {
      document.documentElement.classList.remove("healthcare-qr-print-mode");
      document.body.classList.remove("healthcare-qr-print-mode");
    };
  }, []);

  useEffect(() => {
    if (!autoPrint || !ready || !qrPrint) return;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, ready, qrPrint]);

  return (
    <div className="healthcare-qr-sheet mx-auto flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#f4ebe6] p-4 print:min-h-0 print:bg-[#fffaf7] print:p-0">
      <div className="healthcare-qr-toolbar flex flex-wrap items-center justify-center gap-2 print:hidden">
        <button
          type="button"
          className="btn-primary px-4 py-2 text-sm"
          onClick={() => window.print()}
        >
          {t.healthcareQrPrint}
        </button>
        <a
          className="btn-ghost px-4 py-2 text-sm"
          href={scanUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t.healthcareQrOpenPage}
        </a>
      </div>

      <article
        className="healthcare-qr-card relative flex w-full max-w-[148mm] flex-col overflow-hidden rounded-[18px] border border-[#e4cfc6] bg-[#fffaf7] shadow-[0_18px_40px_rgba(80,20,28,0.14)] print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        style={{ aspectRatio: "148 / 210" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55] print:hidden"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 12% 8%, rgba(214,69,80,0.16), transparent 42%), radial-gradient(circle at 88% 0%, rgba(110,18,32,0.12), transparent 36%), linear-gradient(165deg, #fffaf7 0%, #f7ece6 55%, #f3e2da 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-3 rounded-[14px] border border-[#e8d2c9] print:inset-[4mm]"
          aria-hidden
        />

        <header className="relative z-[1] flex items-center gap-3 px-6 pb-2 pt-6 print:px-[10mm] print:pt-[9mm]">
          <Image
            src="/bloodlink-logo.png"
            alt="BloodLink"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full bg-white object-contain shadow-sm ring-1 ring-[#e8d2c9]"
            priority
          />
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-wide text-[#6e1220]">
              BloodLink BD
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a3a45]">
              {t.healthcareQrEyebrow}
            </p>
          </div>
        </header>

        <div className="relative z-[1] flex flex-1 flex-col items-center px-6 pb-5 pt-3 text-center print:px-[10mm] print:pb-[8mm]">
          <h1 className="max-w-[92%] font-[family-name:var(--font-body)] text-[1.35rem] font-bold leading-snug text-[#1c1412] print:text-[18pt]">
            {displayName}
          </h1>
          {secondaryName ? (
            <p className="mt-1 max-w-[92%] text-[12px] leading-snug text-[#6b5c57] print:text-[9pt]">
              {secondaryName}
            </p>
          ) : null}
          {placeLine ? (
            <p className="mt-2 text-[11px] text-[#7a6a64] print:text-[8.5pt]">
              {placeLine}
            </p>
          ) : null}

          <div className="mt-4 flex flex-1 flex-col items-center justify-center">
            <div className="rounded-[16px] bg-white p-3 shadow-[0_10px_28px_rgba(90,16,28,0.12)] ring-1 ring-[#ead9d1] print:shadow-none">
              {qrScreen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrScreen}
                  alt={t.healthcareQrAlt}
                  width={220}
                  height={220}
                  className="h-[210px] w-[210px] print:hidden"
                />
              ) : (
                <div className="flex h-[210px] w-[210px] items-center justify-center text-xs text-[#9a8a84] print:hidden">
                  {t.loading}
                </div>
              )}
              {qrPrint ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrPrint}
                  alt=""
                  width={220}
                  height={220}
                  className="hidden h-[210px] w-[210px] print:block print:h-[62mm] print:w-[62mm]"
                />
              ) : null}
            </div>
            <p className="mt-4 max-w-[26ch] text-[13px] font-semibold leading-snug text-[#6e1220] print:mt-[5mm] print:text-[10.5pt]">
              {t.healthcareQrScanHint}
            </p>
            <p className="mt-1.5 max-w-[30ch] text-[11px] leading-snug text-[#6b5c57] print:text-[8pt]">
              {t.healthcareQrScanSub}
            </p>
          </div>

          <footer className="mt-auto w-full border-t border-[#ead9d1] pt-3 print:pt-[4mm]">
            {company.contactPhone ? (
              <p className="text-[11px] text-[#5c4e49] print:text-[8pt]">
                {t.healthcareCompanyPhone}: {company.contactPhone}
              </p>
            ) : null}
            <p className="mt-1 font-[family-name:var(--font-display)] text-[11px] font-bold tracking-wide text-[#6e1220] print:text-[8.5pt]">
              bloodlinkbd.org
            </p>
            <p className="mt-0.5 break-all text-[9px] text-[#8a7a74] print:text-[6.5pt]">
              {scanUrl.replace(/^https?:\/\//, "")}
            </p>
          </footer>
        </div>
      </article>

      <p className="max-w-sm text-center text-xs text-[#6b5c57] print:hidden">
        {t.healthcareQrPrintHint}
      </p>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  @page { size: A5 portrait; margin: 0; }
  html.healthcare-qr-print-mode,
  body.healthcare-qr-print-mode {
    margin: 0 !important;
    padding: 0 !important;
    width: 148mm !important;
    height: 210mm !important;
    overflow: hidden !important;
    background: #fffaf7 !important;
    color: #1c1412 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* No visibility:hidden — that breaks iOS Safari print layout. */
  body.healthcare-qr-print-mode .healthcare-qr-sheet {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    display: block !important;
    width: 148mm !important;
    height: 210mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fffaf7 !important;
  }
  body.healthcare-qr-print-mode .healthcare-qr-card {
    display: flex !important;
    width: 148mm !important;
    height: 210mm !important;
    max-width: none !important;
    aspect-ratio: auto !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fffaf7 !important;
  }
  body.healthcare-qr-print-mode .healthcare-qr-toolbar,
  body.healthcare-qr-print-mode header,
  body.healthcare-qr-print-mode nav {
    display: none !important;
  }
}
`,
        }}
      />
    </div>
  );
}
