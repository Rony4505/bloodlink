"use client";

import { useState } from "react";
import type { PosData } from "@/lib/mudidokan/types";
import { verifyAdminPassword } from "@/lib/mudidokan/storage";

type Props = {
  data: PosData;
  tabLabel: string;
  onUnlock: () => void;
  onClose: () => void;
};

export function PosLockModal({ data, tabLabel, onUnlock, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (verifyAdminPassword(data, password)) {
      onUnlock();
      onClose();
      return;
    }
    setError("ভুল পাসওয়ার্ড");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-emerald-900">{tabLabel} — লক</h3>
        <p className="mt-1 text-sm text-slate-500">পাসওয়ার্ড দিন</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="পাসওয়ার্ড"
          className="mt-3 w-full rounded-xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-500"
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-emerald-600 py-2.5 font-bold text-white"
          >
            খুলুন
          </button>
        </div>
      </div>
    </div>
  );
}
