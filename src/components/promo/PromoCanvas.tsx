"use client";

import { useEffect, useRef } from "react";
import { PromoSceneRenderer } from "@/lib/promo/scene-renderer";
import type { PromoSceneId } from "@/lib/promo/timeline";

type PromoCanvasProps = {
  currentTime: number;
  sceneId: PromoSceneId;
  sceneProgress: number;
  playing: boolean;
};

export function PromoCanvas({
  currentTime,
  sceneId,
  sceneProgress: progress,
}: PromoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PromoSceneRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ currentTime, sceneId, progress });

  stateRef.current = { currentTime, sceneId, progress };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: PromoSceneRenderer;
    try {
      renderer = new PromoSceneRenderer(canvas);
      rendererRef.current = renderer;
    } catch (err) {
      console.error("Promo WebGL init failed:", err);
      return;
    }

    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      renderer.resize(el.clientWidth, el.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      renderer.update(s.currentTime, s.sceneId, s.progress);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="promo-canvas-wrap">
      <canvas ref={canvasRef} className="promo-canvas" />
      <div className="promo-vignette" aria-hidden />
      <div className="promo-grain" aria-hidden />
    </div>
  );
}
