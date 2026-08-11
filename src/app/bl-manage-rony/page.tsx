import { redirect } from "next/navigation";

/** Old hidden path retired — keep it private by sending away. */
export default function OldAdminPathPage() {
  redirect("/");
}
