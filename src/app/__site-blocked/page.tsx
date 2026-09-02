import Link from "next/link";
import { getAppMode } from "@/lib/app-mode";

export default function SiteBlockedPage() {
  const mode = getAppMode();
  const isFashion = mode === "fashion";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9b7766]">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-[#2b1d19]">
        {isFashion ? "This page is not part of Noorzaa" : "This page is not part of BloodLink"}
      </h1>
      <p className="mt-4 text-base leading-7 text-[#6e5449]">
        {isFashion
          ? "BloodLink lives on a separate website. Continue shopping on Noorzaa."
          : "Noorzaa lives on a separate website. Continue on BloodLink BD."}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[#2b1d19] px-5 py-3 text-sm font-semibold text-white"
      >
        {isFashion ? "Back to Noorzaa" : "Back to BloodLink"}
      </Link>
    </main>
  );
}
