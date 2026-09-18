"use client";

import { useEffect, useRef } from "react";
import { BrandLogo3d } from "@/components/BrandLogo3d";

export const INTRO_SESSION_KEY = "bl_intro_v1";

/**
 * Inline `<head>` script: decide before first paint whether the intro plays
 * (once per tab session, never on admin/volunteer tooling pages).
 */
export const INTRO_BOOT_SCRIPT = `(function(){var h=document.documentElement;try{var seen=sessionStorage.getItem("${INTRO_SESSION_KEY}");var p=location.pathname;var skip=/^\\/(admin|volunteer|api|_next|__)/.test(p)||/^\\/work\\//.test(p);h.setAttribute("data-intro",seen||skip?"0":"1");}catch(e){h.setAttribute("data-intro","0");}})();`;

const LETTERS = ["B", "l", "o", "o", "d", "L", "i", "n", "k"];
const INTRO_MS = 2700;
const OUT_MS = 520;
const PARTICLES = [
  { x: 18, y: 32, d: 0.2, s: 0.7 },
  { x: 80, y: 26, d: 0.6, s: 0.5 },
  { x: 12, y: 62, d: 1.1, s: 0.9 },
  { x: 86, y: 58, d: 0.4, s: 0.6 },
  { x: 28, y: 78, d: 0.9, s: 0.5 },
  { x: 72, y: 76, d: 1.4, s: 0.8 },
  { x: 50, y: 18, d: 1.7, s: 0.4 },
];

export function IntroSplash() {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    if (html.getAttribute("data-intro") !== "1") return;
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let outTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      rootRef.current?.classList.add("bl-intro--out");
      html.setAttribute("data-intro", "out");
      outTimer = setTimeout(() => html.setAttribute("data-intro", "0"), OUT_MS);
    };

    const el = rootRef.current;
    const onTap = () => finish();
    el?.addEventListener("pointerdown", onTap);
    const timer = setTimeout(finish, reduce ? 700 : INTRO_MS);
    return () => {
      clearTimeout(timer);
      if (outTimer) clearTimeout(outTimer);
      el?.removeEventListener("pointerdown", onTap);
    };
  }, []);

  return (
    <div ref={rootRef} className="bl-intro" aria-hidden="true">
      <div className="bl-intro__glow" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="bl-intro__particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.d}s`,
            transform: `scale(${p.s})`,
          }}
        />
      ))}
      <div className="bl-intro__stage">
        <span className="bl-intro__drop" />
        <span className="bl-intro__ring" />
        <div className="bl-intro__logo">
          <BrandLogo3d className="bl-intro__logo-svg" idPrefix="intro" />
          <span className="bl-intro__logo-shadow" />
        </div>
        <div className="bl-intro__word">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              className={`bl-intro__ch ${i < 5 ? "bl-intro__ch--blood" : "bl-intro__ch--link"}`}
              style={{ animationDelay: `${1.15 + i * 0.07}s` }}
            >
              {ch}
            </span>
          ))}
          <span className="bl-intro__bd" style={{ animationDelay: "1.85s" }}>
            BD
          </span>
        </div>
        <div className="bl-intro__reflect">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              className={`bl-intro__ch ${i < 5 ? "bl-intro__ch--blood" : "bl-intro__ch--link"}`}
              style={{ animationDelay: `${1.15 + i * 0.07}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
