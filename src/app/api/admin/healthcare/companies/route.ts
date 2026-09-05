import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  facilityPublicSlug,
  getHealthcareFacilityById,
} from "@/lib/healthcare-facilities";
import {
  appointmentsForCompany,
  createHealthcareCompany,
  deleteHealthcareCompany,
  doctorsForCompany,
  ensureHealthcareNameLinkTokens,
  loadHealthcarePlatform,
  regenerateHealthcareCompanyToken,
  updateHealthcareCompany,
} from "@/lib/healthcare-platform";
import {
  healthcareCompanyBannerUrl,
  healthcareCompanyPublicUrl,
  healthcareManageUrl,
} from "@/lib/healthcare-urls";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureHealthcareNameLinkTokens();
  const data = await loadHealthcarePlatform();
  const companies = await Promise.all(
    data.companies.map(async (company) => {
      const doctors = doctorsForCompany(data, company.id);
      const appointments = appointmentsForCompany(data, company.id);
      const facilities = await Promise.all(
        company.linkedDghsIds.map(async (id) => {
          const facility = await getHealthcareFacilityById(id);
          return facility
            ? {
                dghsId: facility.dghsId,
                slug: facilityPublicSlug(facility),
                name: facility.name,
                nameBn: facility.nameBn,
              }
            : { dghsId: id, slug: id, name: id, nameBn: "" };
        }),
      );
      return {
        ...company,
        portalUrl: healthcareManageUrl(company.linkToken),
        publicUrl: healthcareCompanyPublicUrl(company.linkToken),
        bannerUrl: healthcareCompanyBannerUrl(company.linkToken),
        doctorCount: doctors.length,
        appointmentCount: appointments.length,
        pendingAppointments: appointments.filter((a) => a.status === "pending").length,
        facilities,
      };
    }),
  );

  return NextResponse.json({
    companies,
    stats: {
      total: companies.length,
      active: companies.filter((c) => c.enabled).length,
      doctors: data.doctors.length,
      appointments: data.appointments.length,
    },
  });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const linkedDghsIds = Array.isArray(body?.linkedDghsIds)
      ? body.linkedDghsIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const name = String(body?.name || "").trim();
    if (!name && linkedDghsIds.length === 0) {
      return NextResponse.json({ error: "Name or DGHS facility link required" }, { status: 400 });
    }

    const company = await createHealthcareCompany({
      name,
      nameBn: body?.nameBn,
      contactPhone: body?.contactPhone,
      contactEmail: body?.contactEmail,
      district: body?.district,
      upazila: body?.upazila,
      linkedDghsIds: body?.linkedDghsIds,
    });

    return NextResponse.json({
      ok: true,
      company: {
        ...company,
        portalUrl: healthcareManageUrl(company.linkToken),
        publicUrl: healthcareCompanyPublicUrl(company.linkToken),
        bannerUrl: healthcareCompanyBannerUrl(company.linkToken),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const companyId = String(body?.companyId || "").trim();
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    if (body?.regenerateToken) {
      const company = await regenerateHealthcareCompanyToken(companyId);
      if (!company) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        company: {
          ...company,
          portalUrl: healthcareManageUrl(company.linkToken),
          publicUrl: healthcareCompanyPublicUrl(company.linkToken),
          bannerUrl: healthcareCompanyBannerUrl(company.linkToken),
        },
      });
    }

    const company = await updateHealthcareCompany(companyId, {
      name: body?.name,
      nameBn: body?.nameBn,
      contactPhone: body?.contactPhone,
      contactEmail: body?.contactEmail,
      enabled: body?.enabled,
      linkedDghsIds: body?.linkedDghsIds,
      district: body?.district,
      upazila: body?.upazila,
    });

    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      company: {
        ...company,
        portalUrl: healthcareManageUrl(company.linkToken),
        publicUrl: healthcareCompanyPublicUrl(company.linkToken),
        bannerUrl: healthcareCompanyBannerUrl(company.linkToken),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId")?.trim() || "";
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  const deleted = await deleteHealthcareCompany(companyId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
