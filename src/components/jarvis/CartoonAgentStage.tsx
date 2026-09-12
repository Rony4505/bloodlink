"use client";

import type { AgentRecord, JarvisCommand } from "@/lib/jarvis/types";

type Props = {
  command: JarvisCommand | null;
  agents: AgentRecord[];
};

function stepState(command: JarvisCommand | null, stepId: string): "idle" | "active" | "done" {
  if (!command) return "idle";
  const step = command.steps.find((s) => s.id === stepId);
  if (!step) return "idle";
  if (step.status === "active") return "active";
  if (step.status === "done") return "done";
  return "idle";
}

function AgentCharacter({
  name,
  role,
  color,
  state,
  emoji,
}: {
  name: string;
  role: string;
  color: string;
  state: "idle" | "active" | "done";
  emoji: string;
}) {
  return (
    <div
      className={`jarvis-agent ${state === "active" ? "jarvis-agent-active" : ""} ${state === "done" ? "jarvis-agent-done" : ""}`}
    >
      <div className="jarvis-agent-body" style={{ background: color }}>
        <span className="jarvis-agent-face">{emoji}</span>
        {state === "active" ? <span className="jarvis-agent-spark" /> : null}
      </div>
      <p className="jarvis-agent-name">{name}</p>
      <p className="jarvis-agent-role">{role}</p>
      {state === "active" ? <div className="jarvis-agent-shadow" /> : null}
    </div>
  );
}

export function CartoonAgentStage({ command, agents }: Props) {
  const phone = stepState(command, "phone");
  const hub = stepState(command, "hub");
  const laptop = stepState(command, "laptop");
  const courier = stepState(command, "courier");

  const laptopOnline = agents.some((a) => a.kind === "laptop" && a.status !== "offline");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-white">Agent animation stage</h2>
        <span className="rounded-full border border-teal-400/20 px-3 py-1 text-xs text-teal-100/75">
          {laptopOnline ? "Laptop agent online" : "Demo mode — laptop agent offline"}
        </span>
      </div>

      <div className="jarvis-stage">
        <div className="jarvis-stage-path" aria-hidden />

        <AgentCharacter
          name="Phone Agent"
          role="Command"
          color="#38bdf8"
          state={phone}
          emoji="📱"
        />
        <AgentCharacter
          name="Brain Agent"
          role="Hub"
          color="#fbbf24"
          state={hub}
          emoji="🧠"
        />
        <AgentCharacter
          name="Laptop Agent"
          role="Windows"
          color="#34d399"
          state={laptop}
          emoji="💻"
        />
        <AgentCharacter
          name="Courier Agent"
          role="Delivery"
          color="#fb923c"
          state={courier}
          emoji="📸"
        />

        {command ? (
          <div className="jarvis-stage-caption">
            <p className="text-sm text-teal-50/90">&ldquo;{command.rawText}&rdquo;</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {command.steps.map((step) => (
                <span
                  key={step.id}
                  className={`jarvis-step-pill jarvis-step-${step.status}`}
                >
                  {step.labelBn}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="jarvis-stage-caption">
            <p className="text-sm text-teal-100/70">
              কমান্ড দিন — cartoon agent-রা কাজ শুরু করবে
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
