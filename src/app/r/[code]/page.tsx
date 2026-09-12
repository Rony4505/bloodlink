import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferralCodeRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 32);
  if (!code) {
    redirect("/register");
  }
  redirect(`/register?ref=${encodeURIComponent(code)}`);
}
