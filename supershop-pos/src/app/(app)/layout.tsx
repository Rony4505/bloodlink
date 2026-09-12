import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();

  return (
    <div className="min-h-screen">
      <AppNav shopName={store.settings.shopName} />
      <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-6 md:py-7">
        {children}
      </div>
    </div>
  );
}
