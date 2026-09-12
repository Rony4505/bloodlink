"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentRecord, JarvisCommand, JarvisEvent } from "@/lib/jarvis/types";
import { CartoonAgentStage } from "./CartoonAgentStage";
import { CommandPanel } from "./CommandPanel";
import { VoiceInput } from "./VoiceInput";

type Snapshot = {
  agents: AgentRecord[];
  commands: JarvisCommand[];
  events: JarvisEvent[];
};

export function JarvisHub() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [commands, setCommands] = useState<JarvisCommand[]>([]);
  const [events, setEvents] = useState<JarvisEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState(false);
  const phoneRegistered = useRef(false);

  const latestCommand = commands[0] ?? null;
  const latestPhoto = useMemo(() => {
    for (const cmd of commands) {
      if (cmd.result?.type === "photo" && cmd.result.url) return cmd.result.url;
    }
    return null;
  }, [commands]);

  const registerPhone = useCallback(async () => {
    if (phoneRegistered.current) return;
    phoneRegistered.current = true;
    const saved = localStorage.getItem("jarvis_phone_agent");
    if (saved) {
      try {
        JSON.parse(saved);
        return;
      } catch {
        localStorage.removeItem("jarvis_phone_agent");
      }
    }
    const res = await fetch("/api/jarvis/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "iPhone Controller", kind: "phone" }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("jarvis_phone_agent", JSON.stringify(data.agent));
    }
  }, []);

  useEffect(() => {
    void registerPhone();
  }, [registerPhone]);

  useEffect(() => {
    const source = new EventSource("/api/jarvis/events");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (message) => {
      const data = JSON.parse(message.data) as
        | { type: "snapshot"; agents: AgentRecord[]; commands: JarvisCommand[]; events: JarvisEvent[] }
        | { type: "event"; agents: AgentRecord[]; commands: JarvisCommand[]; event: JarvisEvent };

      if (data.type === "snapshot") {
        setAgents(data.agents);
        setCommands(data.commands);
        setEvents(data.events);
        return;
      }

      setAgents(data.agents);
      setCommands(data.commands);
      setEvents((prev) => [data.event, ...prev].slice(0, 40));
    };

    return () => source.close();
  }, []);

  const sendCommand = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/jarvis/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
        setCommands((prev) => {
          const rest = prev.filter((c) => c.id !== data.command.id);
          return [data.command, ...rest];
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting]);

  return (
    <div className="jarvis-shell min-h-screen text-teal-50">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-teal-200/70">Personal AI Network</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            JARVIS HUB
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-teal-400/25 bg-teal-950/50 px-4 py-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400 jarvis-pulse-dot" : "bg-rose-400"}`}
          />
          {connected ? "Live connected" : "Reconnecting…"}
          <span className="text-teal-200/60">|</span>
          <span>{agents.filter((a) => a.status !== "offline").length} agents online</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="jarvis-panel overflow-hidden p-4 md:p-6">
          <CartoonAgentStage command={latestCommand} agents={agents} />
          {latestPhoto ? (
            <div className="mt-4 rounded-2xl border border-teal-400/20 bg-teal-950/40 p-3">
              <p className="mb-2 text-sm text-teal-100/80">Latest photo from laptop</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latestPhoto}
                alt="Captured from laptop agent"
                className="max-h-64 w-full rounded-xl object-cover"
              />
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-4">
          <div className="jarvis-panel p-4 md:p-5">
            <h2 className="font-display text-xl font-bold text-white">Command</h2>
            <p className="mt-1 text-sm text-teal-100/70">
              কথা বলুন বা লিখুন — agent-রা অ্যানিমেশনে কাজ করবে
            </p>
            <div className="mt-4 space-y-3">
              <VoiceInput onTranscript={sendCommand} disabled={submitting} />
              <CommandPanel onSubmit={sendCommand} submitting={submitting} />
            </div>
          </div>

          <div className="jarvis-panel p-4 md:p-5">
            <h2 className="font-display text-lg font-bold text-white">Connected agents</h2>
            <ul className="mt-3 space-y-2">
              {agents.length === 0 ? (
                <li className="text-sm text-teal-100/60">No agents yet — run Windows agent on laptop.</li>
              ) : (
                agents.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center justify-between rounded-xl border border-teal-400/15 bg-teal-950/35 px-3 py-2 text-sm"
                  >
                    <span>
                      {agent.name}{" "}
                      <span className="text-teal-200/50">({agent.kind})</span>
                    </span>
                    <span className="rounded-full bg-teal-900/80 px-2 py-0.5 text-xs capitalize text-teal-100">
                      {agent.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="jarvis-panel p-4 md:p-5">
            <h2 className="font-display text-lg font-bold text-white">Live log</h2>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg bg-teal-950/40 px-3 py-2 text-teal-100/85">
                  <span className="text-teal-300/60">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>{" "}
                  {event.messageBn}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
