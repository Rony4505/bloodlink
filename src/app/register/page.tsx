import { RegisterPageClient } from "@/components/RegisterPageClient";
import type { SocialPrefill } from "@/components/RegisterForm";
import { verifySocialProfileToken } from "@/lib/social-auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ social?: string }>;
}) {
  const { social } = await searchParams;
  let prefill: SocialPrefill | null = null;
  if (social) {
    const profile = await verifySocialProfileToken(social);
    if (profile) {
      prefill = {
        token: social,
        provider: profile.provider,
        name: profile.name,
        email: profile.email,
      };
    }
  }
  return <RegisterPageClient social={prefill} expired={Boolean(social) && !prefill} />;
}
