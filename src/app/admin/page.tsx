import { OwnerConsoleClient } from "@/app/bloodlinkbd.admin.rony4505/OwnerConsoleClient";

export const dynamic = "force-dynamic";

/** Public admin entry: login with username/password, then full panel. */
export default function AdminPage() {
  return <OwnerConsoleClient />;
}
