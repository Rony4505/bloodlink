"use client";

import { formatTakaDecimal } from "@/lib/mudidokan/format";
import type { WeightScaleState } from "@/lib/mudidokan/use-weight-scale";

type Props = {
  scale: WeightScaleState;
};

export function DigitalScale({ scale }: Props) {
  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-3 text-white shadow-inner">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>ডিজিটাল ওজন মেশিন</span>
        <span className={scale.connected ? "text-emerald-400" : "text-amber-400"}>
          {scale.connected ? "● LIVE" : scale.manualMode ? "ম্যানুয়াল" : "● OFF"}
        </span>
      </div>

      <div className="rounded-xl bg-black/60 px-3 py-3 text-center font-mono">
        <p className="text-3xl font-bold tracking-wider text-emerald-400">
          {scale.weightGrams.toLocaleString("bn-BD")}
        </p>
        <p className="text-xs text-slate-500">ওজন (গ্রাম)</p>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => scale.connect()}
          disabled={scale.connecting || scale.connected}
          className="rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          স্কেল
        </button>
        <button
          type="button"
          onClick={scale.tare}
          className="rounded-lg bg-slate-600 py-1.5 text-xs font-semibold"
        >
          টেয়ার
        </button>
        <button
          type="button"
          onClick={scale.disconnect}
          disabled={!scale.connected}
          className="rounded-lg bg-red-700/80 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          বন্ধ
        </button>
      </div>

      <label className="mt-2 block">
        <span className="text-xs text-slate-400">ওজন লিখুন</span>
        <input
          type="number"
          step="1"
          min="0"
          placeholder="০"
          value={scale.manualMode && scale.weightGrams > 0 ? scale.weightGrams : ""}
          onChange={(e) => scale.setWeightGrams(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-emerald-300 outline-none focus:border-emerald-500"
        />
      </label>

      {scale.error && <p className="mt-1 text-xs text-amber-300">{scale.error}</p>}
    </div>
  );
}

/** Price from per-kg (or per-liter) rate and grams entered. */
export function weightPriceAmount(pricePerUnit: number, grams: number, unit: string): number {
  if (grams <= 0) return 0;
  if (unit === "গ্রাম") return Math.round((pricePerUnit * grams) / 1000);
  if (unit === "কেজি" || unit === "লিটার") return Math.round((pricePerUnit * grams) / 1000);
  return 0;
}

export function weightPricePreview(pricePerUnit: number, grams: number, unit: string): string {
  const amount = weightPriceAmount(pricePerUnit, grams, unit);
  if (amount <= 0) return "";
  return formatTakaDecimal(amount);
}
