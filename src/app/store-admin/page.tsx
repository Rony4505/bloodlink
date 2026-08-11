import { redirect } from "next/navigation";
import { FashionAdminPanel } from "@/components/fashion/FashionAdminPanel";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";

export default async function StoreAdminPage() {
  const ok = await isFashionAdminAuthenticated();
  if (!ok) redirect("/store-admin/login");
  return <FashionAdminPanel />;
}
