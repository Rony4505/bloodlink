"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  depth: number;
  vy: number;
  r: number;
  phase: number;
};

type Cell = {
  x: number;
  y: number;
  depth: number;
  vx: number;
  vy: number;
  r: number;
};

type Props = {
  /** Cover the viewport behind the full homepage scroll. */
  fixed?: boolean;
};

/**
 * Calm H2 blood ambience — soft floating drops and cells.
 * Designed to feel welcoming, not dizzy or illusion-heavy.
 */
export function BloodHeroBackground({ fixed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    let cells: Cell[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    let elapsed = 0;

    function spawnDrop(randomY = false): Drop {
      const depth = 0.35 + Math.random() * 0.65;
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -60 - Math.random() * h * 0.4,
        depth,
        vy: 0.12 + Math.random() * 0.22,
        r: 10 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
      };
    }

    function spawnCell(): Cell {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        depth: 0.2 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.04,
        r: 2 + Math.random() * 3.5,
      };
    }

    function initScene() {
      const dropCount = w < 640 ? 6 : 10;
      const cellCount = w < 640 ? 14 : 22;
      drops = Array.from({ length: dropCount }, () => spawnDrop(true));
      cells = Array.from({ length: cellCount }, () => spawnCell());
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    }

    function drawBackground() {
      const breathe = 0.5 + Math.sin(elapsed * 0.00035) * 0.04;

      const g = ctx.createLinearGradient(0, 0, w * 0.2, h);
      g.addColorStop(0, "#0a0406");
      g.addColorStop(0.45, "#2e0812");
      g.addColorStop(1, "#120408");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(
        w * 0.5,
        h * 0.36,
        w * 0.06,
        w * 0.5,
        h * 0.42,
        w * 0.88,
      );
      glow.addColorStop(0, `rgba(170,28,48,${0.18 * breathe})`);
      glow.addColorStop(0.5, "rgba(90,16,28,0.1)");
      glow.addColorStop(1, "rgba(8,2,4,0.72)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        w * 0.15,
        w * 0.5,
        h * 0.5,
        w * 1.05,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }

    function drawDrop(d: Drop) {
      const scale = 0.7 + d.depth * 0.45;
      const r = d.r * scale;
      const drift = Math.sin(d.phase + elapsed * 0.0008) * 4 * d.depth;
      const x = d.x + drift;
      const y = d.y;
      const alpha = 0.22 + d.depth * 0.38;

      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(x + 2, y + r * 1.15, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.55);
      ctx.bezierCurveTo(x + r * 0.85, y - r * 0.35, x + r * 0.75, y + r * 0.85, x, y + r);
      ctx.bezierCurveTo(x - r * 0.75, y + r * 0.85, x - r * 0.85, y - r * 0.35, x, y - r * 1.55);
      const fill = ctx.createRadialGradient(x - r * 0.2, y - r * 0.45, r * 0.05, x, y, r * 1.35);
      fill.addColorStop(0, "#ffb8c0");
      fill.addColorStop(0.35, "#e84555");
      fill.addColorStop(0.7, "#9a1830");
      fill.addColorStop(1, "#280810");
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.22, y - r * 0.52, r * 0.14, r * 0.2, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,240,242,0.5)";
      ctx.fill();
      ctx.restore();
    }

    function drawCell(c: Cell) {
      ctx.save();
      ctx.globalAlpha = 0.12 + c.depth * 0.22;
      ctx.fillStyle = c.depth > 0.55 ? "#d84555" : "#8a1830";
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.r * 1.1, c.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick(ts: number) {
      if (!visible) return;
      if (!last) last = ts;
      const dt = Math.min(32, ts - last);
      last = ts;
      elapsed += dt;

      if (!reduced) {
        for (const d of drops) {
          d.y += d.vy * d.depth * (dt / 16);
          d.phase += 0.008 * d.depth * (dt / 16);
          if (d.y > h + 70) Object.assign(d, spawnDrop());
        }
        for (const c of cells) {
          c.x += c.vx * (dt / 16);
          c.y += c.vy * (dt / 16);
          if (c.x < -20) c.x = w + 20;
          if (c.x > w + 20) c.x = -20;
          if (c.y < -20) c.y = h + 20;
          if (c.y > h + 20) c.y = -20;
        }
      }

      drawBackground();
      for (const c of cells) drawCell(c);
      drops.sort((a, b) => a.depth - b.depth);
      for (const d of drops) drawDrop(d);

      raf = requestAnimationFrame(tick);
    }

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fixed]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full [background:#0a0406] ${
        fixed ? "fixed inset-0 h-[100dvh] w-full" : "absolute inset-0"
      }`}
      aria-hidden
    />
  );
}
