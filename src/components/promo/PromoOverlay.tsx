"use client";

import Image from "next/image";
import {
  getSceneAtTime,
  sceneProgress,
  type PromoScene,
} from "@/lib/promo/timeline";

type PromoOverlayProps = {
  currentTime: number;
  showStartScreen: boolean;
  onStart: () => void;
};

function SceneText({ scene, progress }: { scene: PromoScene; progress: number }) {
  const fadeIn = Math.min(1, progress * 3);
  const fadeOut = progress > 0.82 ? Math.max(0, 1 - (progress - 0.82) / 0.18) : 1;
  const opacity = fadeIn * fadeOut;

  return (
    <div className="promo-text" style={{ opacity }}>
      {scene.titleBn ? (
        <h2 className="promo-text__title">{scene.titleBn}</h2>
      ) : null}
      {scene.linesBn.map((line) => (
        <p key={line} className="promo-text__line">
          {line}
        </p>
      ))}
      {scene.linesEn?.[0] ? (
        <p className="promo-text__en">{scene.linesEn.join(" ")}</p>
      ) : null}
    </div>
  );
}

function PhoneMock({
  variant,
  progress,
}: {
  variant: "donor" | "find" | "request" | "ambulance";
  progress: number;
}) {
  const show = progress > 0.15;
  const opacity = show ? Math.min(1, (progress - 0.15) * 2.5) : 0;

  const titles: Record<typeof variant, string> = {
    donor: "Register as Donor",
    find: "Search Donors",
    request: "Emergency Blood Request",
    ambulance: "Ambulance Service",
  };

  return (
    <div className="promo-phone" style={{ opacity }}>
      <div className="promo-phone__device">
        <div className="promo-phone__header">
          <Image src="/bloodlink-logo.png" alt="" width={28} height={28} />
          <span>BloodLink BD</span>
        </div>

        {variant === "donor" && (
          <div className="promo-phone__body">
            <label>Blood Group</label>
            <div className="promo-phone__field">O+</div>
            <label>District</label>
            <div className="promo-phone__field">Dhaka</div>
            <button type="button" className="promo-phone__cta">
              Register as Donor
            </button>
          </div>
        )}

        {variant === "find" && (
          <div className="promo-phone__body">
            <label>Blood Group</label>
            <div className="promo-phone__field">O+</div>
            <label>District</label>
            <div className="promo-phone__field">Dhaka</div>
            <button type="button" className="promo-phone__cta promo-phone__cta--outline">
              Search
            </button>
            {progress > 0.5 ? (
              <div className="promo-phone__results">
                <p className="promo-phone__results-title">Matching Donors Found</p>
                <div className="promo-phone__card">Donor · O+ · Dhaka</div>
                <div className="promo-phone__card">Donor · O+ · Dhaka</div>
              </div>
            ) : null}
          </div>
        )}

        {variant === "request" && (
          <div className="promo-phone__body">
            <p className="promo-phone__emergency">EMERGENCY BLOOD REQUEST</p>
            <label>Blood Group</label>
            <div className="promo-phone__field">O+</div>
            <label>District</label>
            <div className="promo-phone__field">Dhaka</div>
            <button type="button" className="promo-phone__cta">
              Post Emergency Request
            </button>
            {progress > 0.55 ? (
              <div className="promo-phone__notify">
                <p>Emergency Blood Request</p>
                <p className="promo-phone__notify-sub">O+ Blood Needed</p>
              </div>
            ) : null}
          </div>
        )}

        {variant === "ambulance" && (
          <div className="promo-phone__body">
            <p className="promo-phone__emergency">{titles.ambulance}</p>
            <div className="promo-phone__field">64 Districts</div>
            <label>Select District</label>
            <div className="promo-phone__field">Dhaka</div>
            <div className="promo-phone__info">
              Ambulance Service Information
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandReveal({ scene, progress }: { scene: PromoScene; progress: number }) {
  const opacity = Math.min(1, progress * 2);
  return (
    <div className="promo-brand" style={{ opacity }}>
      <Image
        src="/bloodlink-logo.png"
        alt="BloodLink BD"
        width={96}
        height={96}
        className="promo-brand__logo"
        priority
      />
      <h1 className="promo-brand__name">BLOODLINK BD</h1>
      {scene.linesBn[0] ? (
        <p className="promo-brand__tagline">{scene.linesBn[0]}</p>
      ) : null}
      {scene.linesEn?.[0] ? (
        <p className="promo-brand__en">{scene.linesEn[0]}</p>
      ) : null}
    </div>
  );
}

export function PromoOverlay({ currentTime, showStartScreen, onStart }: PromoOverlayProps) {
  const scene = getSceneAtTime(currentTime);
  const progress = sceneProgress(currentTime, scene);

  if (showStartScreen) {
    return (
      <div className="promo-start">
        <div className="promo-start__inner">
          <Image
            src="/bloodlink-logo.png"
            alt="BloodLink BD"
            width={88}
            height={88}
            className="promo-start__logo"
          />
          <h1 className="promo-start__title">BloodLink BD</h1>
          <p className="promo-start__tagline">রক্তের প্রয়োজনে, মানুষের পাশে।</p>
          <p className="promo-start__sub">Connect. Donate. Save a Life.</p>
          <button type="button" className="promo-start__play" onClick={onStart}>
            ▶ Play cinematic promo
          </button>
          <p className="promo-start__note">
            Audio: synthesized placeholder ambience (no copyrighted music)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-overlay">
      {scene.id === "problem" && progress > 0.2 ? (
        <div className="promo-legend" style={{ opacity: Math.min(1, (progress - 0.2) * 2) }}>
          <span className="promo-legend__need">রক্তের প্রয়োজন</span>
          <span className="promo-legend__donor">রক্তদাতা</span>
        </div>
      ) : null}

      {scene.id === "brand" && progress > 0.4 ? (
        <BrandReveal scene={scene} progress={(progress - 0.4) / 0.6} />
      ) : null}

      {scene.id === "donor" ? (
        <PhoneMock variant="donor" progress={progress} />
      ) : null}
      {scene.id === "find" ? <PhoneMock variant="find" progress={progress} /> : null}
      {scene.id === "request" ? (
        <PhoneMock variant="request" progress={progress} />
      ) : null}
      {scene.id === "ambulance" && progress > 0.1 ? (
        <PhoneMock variant="ambulance" progress={progress} />
      ) : null}

      {scene.id === "finale" && progress > 0.55 ? (
        <div className="promo-finale" style={{ opacity: Math.min(1, (progress - 0.55) * 2.5) }}>
          <Image src="/bloodlink-logo.png" alt="" width={72} height={72} />
          <h2>BLOODLINK BD</h2>
          <p>রক্তের প্রয়োজনে, মানুষের পাশে।</p>
          <p className="promo-finale__en">Donate Blood. Find Blood. Save Lives.</p>
          <p className="promo-finale__url">bloodlinkbd.org</p>
        </div>
      ) : null}

      {scene.id !== "brand" && scene.id !== "finale" ? (
        <SceneText scene={scene} progress={progress} />
      ) : scene.id === "brand" && progress < 0.35 ? (
        <SceneText scene={scene} progress={progress} />
      ) : null}

      {scene.id === "emergency" ? (
        <div
          className="promo-heartbeat"
          style={{ opacity: 0.15 + Math.sin(currentTime * Math.PI * 1.2) * 0.08 }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
