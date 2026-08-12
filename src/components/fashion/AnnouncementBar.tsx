"use client";

import { tSetting } from "@/lib/fashion/locale-settings";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import type { StoreSettings } from "@/lib/fashion/types";

export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  const { locale } = useFashionCopy();
  if (!settings.announcementEnabled) return null;
  const text = tSetting(settings, "announcementText", "announcementTextEn", locale, "");
  if (!text.trim()) return null;
  return (
    <div className="bg-[linear-gradient(90deg,#9d6b8a,#c9a0b8,#e8b896)] px-4 py-2 text-center text-sm font-medium text-white">{text}</div>
  );
}
