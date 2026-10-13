"use client";

import { useState } from "react";

const QUICK_COMMANDS = [
  "laptop camera on kore picture tule amar mobile e pathao",
  "laptop screenshot nao",
  "laptop mute koro",
  "ping",
];

type Props = {
  onSubmit: (text: string) => void;
  submitting?: boolean;
};

export function CommandPanel({ onSubmit, submitting }: Props) {
  const [text, setText] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(text);
        setText("");
      }}
    >
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="যেমন: laptop camera on kore picture tule amar mobile e pathao"
        className="w-full rounded-xl border border-teal-400/20 bg-teal-950/50 px-3 py-2 text-sm text-teal-50 outline-none ring-teal-300/40 focus:ring"
      />
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className="w-full rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-teal-950 transition hover:bg-teal-300 disabled:opacity-50"
      >
        {submitting ? "Running…" : "Send command"}
      </button>

      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => onSubmit(cmd)}
            disabled={submitting}
            className="rounded-full border border-teal-400/20 px-3 py-1 text-xs text-teal-100/85 hover:bg-teal-900/50 disabled:opacity-50"
          >
            {cmd.length > 42 ? `${cmd.slice(0, 42)}…` : cmd}
          </button>
        ))}
      </div>
    </form>
  );
}
