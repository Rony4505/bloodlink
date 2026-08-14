"use client";

import { formatTakaDecimal } from "@/lib/mudidokan/format";
import { weightInKg } from "@/lib/mudidokan/units";
import type { WeightScaleState } from "@/lib/mudidokan/use-weight-scale";

type Props = {
  scale: WeightScaleState;
};

export function DigitalScale({ scale }: Props) {
  const displayKg = scale.weightKg;
  const manualInput = displayKg > 0 ? displayKg.toFixed(3) : "";

  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-4 text-white shadow-inner">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
        <span>ডিজিটাল ওজন মেশিন</span>
        <span className={scale.connected ? "text-emerald-400" : "text-amber-400"}>
          {scale.connected ? "● LIVE" : scale.manualMode ? "ম্যানুয়াল" : "● OFF"}
        </span>
      </div>

      <div className="rounded-xl bg-black/60 px-4 py-3 text-center font-mono">
        <span className="text-4xl font-bold tracking-widest text-emerald-400">
          {displayKg.toFixed(3)}
        </span>
        <span className="ml-2 text-lg text-slate-400">kg</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => scale.connect()}
          disabled={scale.connecting || scale.connected}
          className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {scale.connecting ? "..." : "স্কেল"}
        </button>
        <button
          type="button"
          onClick={scale.tare}
          className="rounded-lg bg-slate-600 py-2 text-xs font-semibold"
        >
          টেয়ার
        </button>
        <button
          type="button"
          onClick={scale.disconnect}
          disabled={!scale.connected}
          className="rounded-lg bg-red-700/80 py-2 text-xs font-semibold disabled:opacity-40"
        >
          বন্ধ
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-slate-400">ম্যানুয়াল ওজন (kg)</span>
        <input
          type="number"
          step="0.001"
          min="0"
          placeholder="0.000"
          value={scale.manualMode ? manualInput : ""}
          onChange={(e) => scale.setManualWeight(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-emerald-300 outline-none focus:border-emerald-500"
        />
      </label>

      {scale.error && (
        <p className="mt-2 text-xs text-amber-300">{scale.error}</p>
      )}
    </div>
  );
}

export function weightPricePreview(pricePerUnit: number, weightKg: number, unit: string): string {
  if (weightKg <= 0) return "";
  const displayWeight = unit === "গ্রাম" ? weightKg * 1000 : weightKg;
  const amount = Math.round(pricePerUnit * weightInKg(displayWeight, unit));
  return formatTakaDecimal(amount);
}
