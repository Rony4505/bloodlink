import { redirect } from "next/navigation";
import { BLOODLINK_OWNER_PATH } from "@/lib/bloodlink-admin-path";

/** Legacy hidden path — keep bookmarks working by sending to /admin. */
export default function LegacyOwnerConsolePage() {
  redirect(BLOODLINK_OWNER_PATH);
}
