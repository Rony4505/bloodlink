"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { COPY, type KajmamaLang } from "@/lib/kajmama/copy";
import { CATEGORIES, DEFAULT_PACKAGES } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import { UPAZILAS } from "@/lib/kajmama/geo";
import type {
  Advertisement,
  Category,
  PackagePlan,
  SessionUser,
  AdminBankAccount,
  AdminMobileAccount,
} from "@/lib/kajmama/types";

export type KmMeta = {
  categories: Category[];
  packages: PackagePlan[];
  districts: string[];
  upazilas: Record<string, string[]>;
  ads: Advertisement[];
  contact: { phone: string; email: string; whatsapp: string; facebook: string };
  payments: { banks: AdminBankAccount[]; mobiles: AdminMobileAccount[]; commissionPct: number };
};

const EMPTY_META: KmMeta = {
  categories: CATEGORIES,
  packages: DEFAULT_PACKAGES,
  districts: [],
  upazilas: UPAZILAS,
  ads: [],
  contact: { phone: "01712-345678", email: "support@kajmamabd.com", whatsapp: "01712345678", facebook: "" },
  payments: { banks: [], mobiles: [], commissionPct: 10 },
};

type Ctx = {
  lang: KajmamaLang;
  setLang: (l: KajmamaLang) => void;
  t: (typeof COPY)[KajmamaLang];
  user: SessionUser | null;
  loading: boolean;
  meta: KmMeta;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
};

const KmCtx = createContext<Ctx | null>(null);
const LANG_KEY = "kajmama-lang";

export function KmProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<KajmamaLang>(() => {
    if (typeof window === "undefined") return "bn";
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored === "en" || stored === "bn") return stored;
    } catch {
      /* ignore */
    }
    return "bn";
  });
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<KmMeta>(EMPTY_META);

  const setLang = useCallback((l: KajmamaLang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await kmApi<{ user: SessionUser | null }>("/api/kajmama/auth");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await kmApi("/api/kajmama/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/kajmama/auth")
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((data) => {
        if (!live) return;
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setUser(null);
        setLoading(false);
      });
    fetch("/api/kajmama/meta")
      .then((r) => r.json() as Promise<KmMeta>)
      .then((data) => {
        if (!live) return;
        setMeta({
          categories: data.categories?.length ? data.categories : CATEGORIES,
          packages: data.packages || [],
          districts: data.districts || [],
          upazilas: data.upazilas || UPAZILAS,
          ads: data.ads || [],
          contact: data.contact || EMPTY_META.contact,
          payments: data.payments || EMPTY_META.payments,
        });
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      live = false;
    };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: COPY[lang],
      user,
      loading,
      meta,
      reload,
      logout,
    }),
    [lang, setLang, user, loading, meta, reload, logout],
  );

  return <KmCtx.Provider value={value}>{children}</KmCtx.Provider>;
}

export function useKm() {
  const ctx = useContext(KmCtx);
  if (!ctx) throw new Error("useKm must be inside KmProvider");
  return ctx;
}
