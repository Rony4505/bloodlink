import { redirect } from "next/navigation";

/** Public /admin is hidden — owner uses a private path instead. */
export default function AdminRedirectPage() {
  redirect("/");
}
