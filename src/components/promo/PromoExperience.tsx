"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPromoAudio, mixPromoAudio, type PromoAudioBus } from "@/lib/promo/audio";
import {
  getSceneAtTime,
  PROMO_DURATION,
  sceneProgress,
} from "@/lib/promo/timeline";
import { PromoCanvas } from "@/components/promo/PromoCanvas";
import { PromoControls } from "@/components/promo/PromoControls";
import { PromoOverlay } from "@/components/promo/PromoOverlay";

export function PromoExperience() {
  const [showStart, setShowStart] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const mutedRef = useRef(false);
  const audioRef = useRef<PromoAudioBus | null>(null);

  playingRef.current = playing;
  mutedRef.current = muted;
  timeRef.current = currentTime;

  const scene = getSceneAtTime(currentTime);
  const progress = sceneProgress(currentTime, scene);

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = await createPromoAudio();
    }
    if (audioRef.current.ctx.state === "suspended") {
      await audioRef.current.ctx.resume();
    }
  }, []);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
      return;
    }

    const tick = (now: number) => {
      if (!playingRef.current) return;
      if (lastTickRef.current === 0) lastTickRef.current = now;
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      let next = timeRef.current + delta;
      if (next >= PROMO_DURATION) {
        next = PROMO_DURATION;
        playingRef.current = false;
        setPlaying(false);
      }
      timeRef.current = next;
      setCurrentTime(next);

      if (audioRef.current) {
        mixPromoAudio(audioRef.current, next, mutedRef.current);
      }

      if (playingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      mixPromoAudio(audioRef.current, currentTime, muted);
    }
  }, [currentTime, muted]);

  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  const handleStart = async () => {
    await ensureAudio();
    setShowStart(false);
    timeRef.current = 0;
    setCurrentTime(0);
    setPlaying(true);
  };

  const handlePlayPause = async () => {
    if (showStart) {
      await handleStart();
      return;
    }
    if (!playing) await ensureAudio();
    setPlaying((p) => !p);
  };

  const handleRestart = async () => {
    await ensureAudio();
    setShowStart(false);
    timeRef.current = 0;
    setCurrentTime(0);
    setPlaying(true);
  };

  const handleSkipIntro = () => {
    timeRef.current = 5;
    setCurrentTime(5);
  };

  const handleSeek = (t: number) => {
    const clamped = Math.max(0, Math.min(PROMO_DURATION, t));
    timeRef.current = clamped;
    setCurrentTime(clamped);
  };

  return (
    <div className="promo-root">
      <div className="promo-stage">
        <PromoCanvas
          currentTime={currentTime}
          sceneId={scene.id}
          sceneProgress={progress}
          active={!showStart}
        />
        <PromoOverlay
          currentTime={currentTime}
          showStartScreen={showStart}
          onStart={handleStart}
        />
      </div>
      <PromoControls
        playing={playing}
        muted={muted}
        currentTime={currentTime}
        onPlayPause={handlePlayPause}
        onMute={() => setMuted((m) => !m)}
        onRestart={handleRestart}
        onSkipIntro={handleSkipIntro}
        onSeek={handleSeek}
      />
    </div>
  );
}
