import { redirect } from "next/navigation";

/** Retired admin path — send away so old links stay private. */
export default function RetiredOwnerPathPage() {
  redirect("/");
}
