"use client";

import { use, useEffect, useState } from "react";
import { HealthcareQrBanner } from "@/components/healthcare/HealthcareQrBanner";
import { useLocale } from "@/lib/i18n/locale-context";

type Params = { params: Promise<{ companyId: string }> };

type CompanyPayload = {
  company?: {
    id: string;
    slug: string;
    name: string;
    nameBn: string;
    contactPhone: string;
    district: string;
    upazila: string;
  };
  error?: string;
};

export default function HealthcareCompanyBannerPage({ params }: Params) {
  const { companyId } = use(params);
  const { t } = useLocale();
  const [company, setCompany] = useState<CompanyPayload["company"] | null>(null);
  const [error, setError] = useState("");
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAutoPrint(params.get("print") === "1");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/healthcare/company/${encodeURIComponent(companyId)}`)
      .then(async (res) => {
        const json = (await res.json()) as CompanyPayload;
        if (!res.ok || !json.company) {
          if (!cancelled) setError(json.error || t.healthcareLoadError);
          return;
        }
        if (!cancelled) setCompany(json.company);
      })
      .catch(() => {
        if (!cancelled) setError(t.healthcareLoadError);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, t.healthcareLoadError]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center text-sm text-[var(--blood)]">
        {error}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-[color-mix(in_oklab,var(--ink)_55%,white)]">
        {t.loading}
      </div>
    );
  }

  return (
    <HealthcareQrBanner
      autoPrint={autoPrint}
      company={{
        id: company.id,
        slug: company.slug || company.id,
        name: company.name,
        nameBn: company.nameBn,
        contactPhone: company.contactPhone,
        district: company.district,
        upazila: company.upazila,
      }}
    />
  );
}
