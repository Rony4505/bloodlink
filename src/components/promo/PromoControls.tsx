"use client";

import { PROMO_DURATION } from "@/lib/promo/timeline";

type PromoControlsProps = {
  playing: boolean;
  muted: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onMute: () => void;
  onRestart: () => void;
  onSkipIntro: () => void;
  onSeek: (t: number) => void;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PromoControls({
  playing,
  muted,
  currentTime,
  onPlayPause,
  onMute,
  onRestart,
  onSkipIntro,
  onSeek,
}: PromoControlsProps) {
  const pct = (currentTime / PROMO_DURATION) * 100;

  return (
    <div className="promo-controls" aria-label="Promo playback controls">
      <div className="promo-controls__progress">
        <input
          type="range"
          min={0}
          max={PROMO_DURATION}
          step={0.05}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Playback progress"
          className="promo-controls__slider"
        />
        <div className="promo-controls__times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(PROMO_DURATION)}</span>
        </div>
      </div>

      <div className="promo-controls__buttons">
        <button type="button" onClick={onPlayPause} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? "Unmute" : "Mute"}
        </button>
        <button type="button" onClick={onRestart} aria-label="Restart">
          Restart
        </button>
        {currentTime < 5 ? (
          <button type="button" onClick={onSkipIntro} aria-label="Skip intro">
            Skip intro
          </button>
        ) : null}
      </div>

      <div
        className="promo-controls__bar"
        style={{ transform: `scaleX(${pct / 100})` }}
        aria-hidden
      />
    </div>
  );
}
