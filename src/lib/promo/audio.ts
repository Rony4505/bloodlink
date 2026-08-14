/**
 * Procedural audio placeholders — royalty-free synthesized ambience.
 * Replace with licensed music/SFX in production if desired.
 */

export type PromoAudioBus = {
  ctx: AudioContext;
  master: GainNode;
  heartbeat: GainNode;
  ambient: GainNode;
  tech: GainNode;
  dispose: () => void;
};

function makeNoise(ctx: AudioContext, duration = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  return buffer;
}

export async function createPromoAudio(): Promise<PromoAudioBus> {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const heartbeat = ctx.createGain();
  heartbeat.gain.value = 0;
  heartbeat.connect(master);

  const ambient = ctx.createGain();
  ambient.gain.value = 0;
  ambient.connect(master);

  const tech = ctx.createGain();
  tech.gain.value = 0;
  tech.connect(master);

  // Low ambient pad
  const oscPad = ctx.createOscillator();
  oscPad.type = "sine";
  oscPad.frequency.value = 55;
  const padGain = ctx.createGain();
  padGain.gain.value = 0.08;
  oscPad.connect(padGain);
  padGain.connect(ambient);
  oscPad.start();

  const oscPad2 = ctx.createOscillator();
  oscPad2.type = "triangle";
  oscPad2.frequency.value = 82.5;
  const pad2Gain = ctx.createGain();
  pad2Gain.gain.value = 0.04;
  oscPad2.connect(pad2Gain);
  pad2Gain.connect(ambient);
  oscPad2.start();

  // Filtered noise bed
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoise(ctx, 4);
  noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 420;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.06;
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ambient);
  noiseSrc.start();

  // Heartbeat pulse (scheduled in update)
  const hbOsc = ctx.createOscillator();
  hbOsc.type = "sine";
  hbOsc.frequency.value = 52;
  const hbFilter = ctx.createBiquadFilter();
  hbFilter.type = "lowpass";
  hbFilter.frequency.value = 120;
  hbOsc.connect(hbFilter);
  hbFilter.connect(heartbeat);
  hbOsc.start();

  // Soft tech blip
  const techOsc = ctx.createOscillator();
  techOsc.type = "sine";
  techOsc.frequency.value = 880;
  const techFilter = ctx.createBiquadFilter();
  techFilter.type = "bandpass";
  techFilter.frequency.value = 1200;
  techOsc.connect(techFilter);
  techFilter.connect(tech);
  techOsc.start();

  return {
    ctx,
    master,
    heartbeat,
    ambient,
    tech,
    dispose: () => {
      oscPad.stop();
      oscPad2.stop();
      noiseSrc.stop();
      hbOsc.stop();
      techOsc.stop();
      void ctx.close();
    },
  };
}

/** Drive bus levels from timeline position (seconds). */
export function mixPromoAudio(bus: PromoAudioBus, t: number, muted: boolean) {
  const target = muted ? 0 : 1;
  const now = bus.ctx.currentTime;
  bus.master.gain.setTargetAtTime(0.55 * target, now, 0.08);

  let hb = 0;
  let amb = 0;
  let techLevel = 0;

  if (t < 5) {
    hb = 0.35 + Math.sin(t * Math.PI * 1.2) * 0.08;
    amb = 0.25;
  } else if (t < 10) {
    hb = 0.12;
    amb = 0.45;
  } else if (t < 15) {
    hb = 0.28;
    amb = 0.5;
    techLevel = 0.08;
  } else if (t < 20) {
    hb = 0.1;
    amb = 0.35;
    techLevel = 0.18;
  } else if (t < 25) {
    hb = 0.08;
    amb = 0.3;
    techLevel = 0.12;
  } else if (t < 30) {
    hb = 0.22;
    amb = 0.35;
    techLevel = 0.15;
  } else if (t < 34) {
    hb = 0.08;
    amb = 0.4;
    techLevel = 0.05;
  } else {
    hb = 0.2 + (t - 34) * 0.04;
    amb = 0.55;
  }

  bus.heartbeat.gain.setTargetAtTime(hb * target, now, 0.12);
  bus.ambient.gain.setTargetAtTime(amb * target, now, 0.2);
  bus.tech.gain.setTargetAtTime(techLevel * target, now, 0.15);
}
