"use client";

import { useEffect, useRef } from "react";
import { PromoSceneRenderer } from "@/lib/promo/scene-renderer";
import type { PromoSceneId } from "@/lib/promo/timeline";

type PromoCanvasProps = {
  currentTime: number;
  sceneId: PromoSceneId;
  sceneProgress: number;
  active: boolean;
};

export function PromoCanvas({
  currentTime,
  sceneId,
  sceneProgress: progress,
  active,
}: PromoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PromoSceneRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new PromoSceneRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      renderer.resize(el.clientWidth, el.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    rendererRef.current?.update(currentTime, sceneId, progress);
  }, [active, currentTime, sceneId, progress]);

  return (
    <div ref={containerRef} className="promo-canvas-wrap">
      <canvas ref={canvasRef} className="promo-canvas" />
      <div className="promo-vignette" aria-hidden />
      <div className="promo-grain" aria-hidden />
    </div>
  );
}
