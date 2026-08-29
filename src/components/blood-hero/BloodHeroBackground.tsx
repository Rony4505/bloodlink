"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  z: number;
  vy: number;
  r: number;
  wobble: number;
  tilt: number;
};

type Ripple = {
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  z: number;
};

type Cell = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  r: number;
};

type Props = {
  /** Cover the viewport behind the full homepage scroll. */
  fixed?: boolean;
};

/**
 * H2 blood theme — layered 3D-feel drops, ripples, and cells. No white/cream fills.
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
    let ripples: Ripple[] = [];
    let cells: Cell[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    let scrollY = 0;

    function spawnDrop(randomY = false): Drop {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -80 - Math.random() * 140,
        z: 0.25 + Math.random() * 0.75,
        vy: 0.4 + Math.random() * 0.9,
        r: 14 + Math.random() * 28,
        wobble: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.35,
      };
    }

    function spawnCell(): Cell {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.22,
        r: 2.5 + Math.random() * 6,
      };
    }

    function initScene() {
      const dropCount = w < 640 ? 14 : 24;
      const cellCount = w < 640 ? 28 : 44;
      drops = Array.from({ length: dropCount }, () => spawnDrop(true));
      cells = Array.from({ length: cellCount }, () => spawnCell());
      ripples = [];
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
      const parallax = fixed ? scrollY * 0.08 : 0;
      const g = ctx.createLinearGradient(0, parallax, w * 0.25, h + parallax);
      g.addColorStop(0, "#0a0406");
      g.addColorStop(0.4, "#3a0a14");
      g.addColorStop(1, "#140508");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(
        w * 0.5,
        h * 0.38 + parallax * 0.2,
        w * 0.04,
        w * 0.5,
        h * 0.42,
        w * 0.95,
      );
      glow.addColorStop(0, "rgba(180,30,50,0.28)");
      glow.addColorStop(0.45, "rgba(110,18,32,0.14)");
      glow.addColorStop(1, "rgba(8,2,4,0.65)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    function fillDropAt(
      x: number,
      y: number,
      r: number,
      tilt: number,
      paint: CanvasGradient | string,
      lineWidth = 0,
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.9);
      ctx.bezierCurveTo(r * 1.1, -r * 0.42, r, r * 1.08, 0, r * 1.2);
      ctx.bezierCurveTo(-r, r * 1.08, -r * 1.1, -r * 0.42, 0, -r * 1.9);
      ctx.fillStyle = paint;
      ctx.fill();
      if (lineWidth > 0) {
        ctx.strokeStyle = "rgba(255,200,205,0.35)";
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDrop(d: Drop) {
      const scale = 0.55 + d.z * 1.15;
      const r = d.r * scale;
      const alpha = 0.5 + d.z * 0.5;
      const x = d.x + Math.sin(d.wobble) * 12 * d.z;
      const y = d.y + (fixed ? scrollY * 0.05 * d.z : 0);
      const blur = 0.65 + d.z * 0.35;

      ctx.save();
      // Ground shadow — stronger 3D depth
      ctx.globalAlpha = alpha * blur * 0.42;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.ellipse(x + 6 * d.z, y + r * 1.42, r * 0.92, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back layer drop (offset for parallax depth)
      ctx.globalAlpha = alpha * blur * 0.55;
      fillDropAt(x + 5 * d.z, y + 4 * d.z, r * 1.02, d.tilt + 0.1, "rgba(30,4,10,0.82)");

      ctx.globalAlpha = alpha * blur * 0.62;
      fillDropAt(x + 3 * d.z, y + 2 * d.z, r * 0.98, d.tilt + 0.08, "rgba(40,6,12,0.75)");

      const dg = ctx.createRadialGradient(
        x - r * 0.32,
        y - r * 0.68,
        r * 0.04,
        x,
        y,
        r * 1.85,
      );
      dg.addColorStop(0, "#ffc8ce");
      dg.addColorStop(0.22, "#ff6b78");
      dg.addColorStop(0.48, "#ef4a58");
      dg.addColorStop(0.68, "#b81e32");
      dg.addColorStop(0.88, "#6e1220");
      dg.addColorStop(1, "#180408");
      ctx.globalAlpha = alpha;
      fillDropAt(x, y, r, d.tilt, dg, 1.2 + d.z * 1.5);

      // Specular highlight — glassy 3D shine
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(d.tilt);
      ctx.globalAlpha = alpha * 0.82;
      ctx.beginPath();
      ctx.ellipse(-r * 0.34, -r * 0.74, r * 0.22, r * 0.34, -0.55, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.fill();
      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.ellipse(r * 0.18, -r * 0.38, r * 0.14, r * 0.2, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,230,235,0.65)";
      ctx.fill();
      ctx.restore();

      // Rim light
      ctx.globalAlpha = alpha * 0.18;
      fillDropAt(x - 1, y - 1, r * 1.01, d.tilt, "rgba(255,160,170,0.35)", 0.8);

      ctx.restore();
    }

    function drawRipple(rp: Ripple) {
      const prog = rp.life / rp.maxLife;
      const alpha = (1 - prog) * 0.38 * rp.z;
      ctx.strokeStyle = `rgba(255,100,110,${alpha})`;
      ctx.lineWidth = 2 + rp.z * 2.5;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,180,185,${alpha * 0.45})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r * 0.72, rp.r * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawCell(c: Cell) {
      ctx.save();
      const y = c.y + (fixed ? scrollY * 0.02 * c.z : 0);
      ctx.globalAlpha = 0.25 + c.z * 0.45;
      ctx.fillStyle = c.z > 0.55 ? "#ff6b78" : "#a81c30";
      ctx.beginPath();
      ctx.ellipse(
        c.x,
        y,
        c.r * (1.15 + c.z * 0.55),
        c.r * 0.58 * (1 + c.z * 0.35),
        c.vx * 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "rgba(255,190,195,0.25)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    function tick(ts: number) {
      if (!visible) return;
      if (!last) last = ts;
      const dt = Math.min(32, ts - last);
      last = ts;

      if (!reduced) {
        for (const d of drops) {
          d.y += d.vy * d.z * (dt / 16);
          d.wobble += 0.02 * d.z;
          d.tilt += Math.sin(d.wobble * 0.7) * 0.002;
          if (d.y > h + 90) {
            ripples.push({
              x: d.x,
              y: Math.min(h - 8, d.y),
              r: 8,
              life: 0,
              maxLife: 120 + d.z * 50,
              z: d.z,
            });
            Object.assign(d, spawnDrop());
          }
        }
        for (const rp of ripples) {
          rp.life += dt;
          rp.r += (dt / 16) * (3 + rp.z * 3);
        }
        ripples = ripples.filter((rp) => rp.life < rp.maxLife);
        for (const c of cells) {
          c.x += c.vx * (dt / 16);
          c.y += c.vy * (dt / 16);
          if (c.x < -28) c.x = w + 28;
          if (c.x > w + 28) c.x = -28;
          if (c.y < -28) c.y = h + 28;
          if (c.y > h + 28) c.y = -28;
        }
      }

      drawBackground();
      for (const rp of ripples) drawRipple(rp);
      for (const c of cells) drawCell(c);
      drops.sort((a, b) => a.z - b.z);
      for (const d of drops) drawDrop(d);

      raf = requestAnimationFrame(tick);
    }

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    if (fixed) window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (fixed) window.removeEventListener("scroll", onScroll);
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
