"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  z: number;
  vy: number;
  r: number;
  wobble: number;
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

/**
 * H2 hero background — 3D-feel blood drops, ripples, and cells on a dark crimson
 * canvas (no white). Respects prefers-reduced-motion.
 */
export function BloodHeroBackground() {
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

    function spawnDrop(randomY = false): Drop {
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -50 - Math.random() * 100,
        z: 0.35 + Math.random() * 0.65,
        vy: 0.35 + Math.random() * 0.75,
        r: 10 + Math.random() * 22,
        wobble: Math.random() * Math.PI * 2,
      };
    }

    function spawnCell(): Cell {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.18,
        r: 2 + Math.random() * 5,
      };
    }

    function initScene() {
      const dropCount = w < 640 ? 6 : 10;
      const cellCount = w < 640 ? 18 : 28;
      drops = Array.from({ length: dropCount }, () => spawnDrop(true));
      cells = Array.from({ length: cellCount }, () => spawnCell());
      ripples = [];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, "#120608");
      g.addColorStop(0.45, "#3a0a14");
      g.addColorStop(1, "#1c0a0c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(
        w * 0.55,
        h * 0.35,
        w * 0.05,
        w * 0.55,
        h * 0.45,
        w * 0.85,
      );
      glow.addColorStop(0, "rgba(155,27,46,0.22)");
      glow.addColorStop(0.55, "rgba(110,18,32,0.12)");
      glow.addColorStop(1, "rgba(12,4,6,0.55)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    function drawDrop(d: Drop) {
      const scale = 0.55 + d.z * 0.85;
      const r = d.r * scale;
      const alpha = 0.4 + d.z * 0.5;
      const x = d.x + Math.sin(d.wobble) * 8 * d.z;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, d.y - r * 1.85);
      ctx.bezierCurveTo(
        x + r * 1.05,
        d.y - r * 0.45,
        x + r * 0.95,
        d.y + r * 1.05,
        x,
        d.y + r * 1.15,
      );
      ctx.bezierCurveTo(
        x - r * 0.95,
        d.y + r * 1.05,
        x - r * 1.05,
        d.y - r * 0.45,
        x,
        d.y - r * 1.85,
      );

      const dg = ctx.createRadialGradient(
        x - r * 0.25,
        d.y - r * 0.55,
        r * 0.08,
        x,
        d.y,
        r * 1.6,
      );
      dg.addColorStop(0, "#ff8a96");
      dg.addColorStop(0.35, "#d64550");
      dg.addColorStop(0.7, "#9b1b2e");
      dg.addColorStop(1, "#3d0812");
      ctx.fillStyle = dg;
      ctx.fill();

      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.ellipse(
        x - r * 0.28,
        d.y - r * 0.65,
        r * 0.22,
        r * 0.32,
        -0.45,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();
      ctx.restore();
    }

    function drawRipple(rp: Ripple) {
      const prog = rp.life / rp.maxLife;
      const alpha = (1 - prog) * 0.3 * rp.z;
      ctx.strokeStyle = `rgba(214,69,80,${alpha})`;
      ctx.lineWidth = 1.5 + rp.z * 2;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawCell(c: Cell) {
      ctx.save();
      ctx.globalAlpha = 0.22 + c.z * 0.38;
      ctx.fillStyle = c.z > 0.55 ? "#e25560" : "#9b1b2e";
      ctx.beginPath();
      ctx.ellipse(
        c.x,
        c.y,
        c.r * (1.1 + c.z * 0.5),
        c.r * 0.55 * (1 + c.z * 0.3),
        c.vx * 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
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
          d.wobble += 0.018 * d.z;
          if (d.y > h + 70) {
            ripples.push({
              x: d.x,
              y: Math.min(h - 12, d.y),
              r: 6,
              life: 0,
              maxLife: 110 + d.z * 40,
              z: d.z,
            });
            Object.assign(d, spawnDrop());
          }
        }
        for (const rp of ripples) {
          rp.life += dt;
          rp.r += (dt / 16) * (2.5 + rp.z * 2.5);
        }
        ripples = ripples.filter((rp) => rp.life < rp.maxLife);
        for (const c of cells) {
          c.x += c.vx * (dt / 16);
          c.y += c.vy * (dt / 16);
          if (c.x < -24) c.x = w + 24;
          if (c.x > w + 24) c.x = -24;
          if (c.y < -24) c.y = h + 24;
          if (c.y > h + 24) c.y = -24;
        }
      }

      drawBackground();
      for (const rp of ripples) drawRipple(rp);
      for (const c of cells) drawCell(c);
      drops.sort((a, b) => a.z - b.z);
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full [background:#1c0a0c]"
      aria-hidden
    />
  );
}
