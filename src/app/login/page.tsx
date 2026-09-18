import { LoginScreen } from "@/components/LoginScreen";
import { socialProviderAvailability } from "@/lib/social-auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginScreen providers={socialProviderAvailability()} />;
}
