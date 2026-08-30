"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { COPY, type KajmamaLang } from "@/lib/kajmama/copy";
import { kmApi } from "@/lib/kajmama/client";
import type { SessionUser } from "@/lib/kajmama/types";

type Ctx = {
  lang: KajmamaLang;
  setLang: (l: KajmamaLang) => void;
  t: (typeof COPY)[KajmamaLang];
  user: SessionUser | null;
  loading: boolean;
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
      reload,
      logout,
    }),
    [lang, setLang, user, loading, reload, logout],
  );

  return <KmCtx.Provider value={value}>{children}</KmCtx.Provider>;
}

export function useKm() {
  const ctx = useContext(KmCtx);
  if (!ctx) throw new Error("useKm must be inside KmProvider");
  return ctx;
}
