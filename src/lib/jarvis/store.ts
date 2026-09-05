import { randomBytes } from "crypto";
import { intentLabel, parseCommandText } from "./parser";
import type {
  AgentKind,
  AgentRecord,
  AgentStatus,
  CommandStep,
  JarvisCommand,
  JarvisEvent,
  PendingAgentJob,
} from "./types";

const AGENT_OFFLINE_MS = 45_000;
const MAX_COMMANDS = 40;
const MAX_EVENTS = 120;

type Listener = (event: JarvisEvent) => void;

function id(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function defaultSteps(): CommandStep[] {
  return [
    {
      id: "phone",
      agentKind: "phone",
      label: "Listening",
      labelBn: "শুনছে",
      status: "pending",
    },
    {
      id: "hub",
      agentKind: "hub",
      label: "Thinking",
      labelBn: "বুঝছে",
      status: "pending",
    },
    {
      id: "laptop",
      agentKind: "laptop",
      label: "Working",
      labelBn: "কাজ করছে",
      status: "pending",
    },
    {
      id: "courier",
      agentKind: "phone",
      label: "Sending",
      labelBn: "পাঠাচ্ছে",
      status: "pending",
    },
  ];
}

function stepLabelForIntent(intent: JarvisCommand["intent"], stepId: string): CommandStep {
  const base = defaultSteps().find((s) => s.id === stepId)!;
  if (stepId === "laptop") {
    if (intent === "camera_capture") {
      return { ...base, label: "Capturing", labelBn: "ছবি তুলছে" };
    }
    if (intent === "screenshot") {
      return { ...base, label: "Screenshot", labelBn: "স্ক্রিনশট নিচ্ছে" };
    }
  }
  return base;
}

type JarvisState = {
  agents: Map<string, AgentRecord>;
  commands: JarvisCommand[];
  pendingJobs: Map<string, PendingAgentJob>;
  events: JarvisEvent[];
  listeners: Set<Listener>;
};

declare global {
  var __jarvisStore: JarvisState | undefined;
}

function state(): JarvisState {
  if (!globalThis.__jarvisStore) {
    globalThis.__jarvisStore = {
      agents: new Map(),
      commands: [],
      pendingJobs: new Map(),
      events: [],
      listeners: new Set(),
    };
  }
  return globalThis.__jarvisStore;
}

function pushEvent(
  type: JarvisEvent["type"],
  message: string,
  messageBn: string,
  payload?: unknown,
): JarvisEvent {
  const event: JarvisEvent = {
    id: id("evt"),
    type,
    message,
    messageBn,
    payload,
    timestamp: Date.now(),
  };
  const s = state();
  s.events.unshift(event);
  if (s.events.length > MAX_EVENTS) s.events.length = MAX_EVENTS;
  for (const listener of s.listeners) listener(event);
  return event;
}

function setAgentStatus(agent: AgentRecord, status: AgentStatus) {
  agent.status = status;
  agent.lastSeen = Date.now();
  pushEvent("agents", `${agent.name} is ${status}`, `${agent.name} ${status}`, {
    agents: listAgents(),
  });
}

function findLaptopAgent(): AgentRecord | null {
  const now = Date.now();
  for (const agent of state().agents.values()) {
    if (agent.kind !== "laptop") continue;
    if (now - agent.lastSeen <= AGENT_OFFLINE_MS) return agent;
  }
  return null;
}

function updateStep(command: JarvisCommand, stepId: string, status: CommandStep["status"]) {
  const step = command.steps.find((s) => s.id === stepId);
  if (!step) return;
  step.status = status;
  pushEvent("step", step.label, step.labelBn, { commandId: command.id, step });
}

function finishCommand(
  command: JarvisCommand,
  result: JarvisCommand["result"],
  failed = false,
) {
  command.status = failed ? "failed" : "completed";
  command.result = result;
  command.updatedAt = Date.now();
  for (const step of command.steps) {
    if (step.status === "active") step.status = failed ? "failed" : "done";
    if (step.status === "pending") step.status = failed ? "failed" : "done";
  }
  pushEvent(
    "command",
    failed ? "Command failed" : "Command completed",
    failed ? "কমান্ড ব্যর্থ" : "কমান্ড সম্পন্ন",
    { command },
  );
  if (result?.type === "photo" && result.url) {
    pushEvent("photo", "Photo ready", "ছবি প্রস্তুত", { commandId: command.id, url: result.url });
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSimulation(command: JarvisCommand) {
  command.simulated = true;
  command.status = "running";
  pushEvent("command", "Simulation started", "ডেমো মোড চালু", { command });

  updateStep(command, "phone", "active");
  setAgentStatus(getOrCreateHubAgent(), "listening");
  await sleep(900);
  updateStep(command, "phone", "done");

  updateStep(command, "hub", "active");
  setAgentStatus(getOrCreateHubAgent(), "thinking");
  await sleep(1100);
  updateStep(command, "hub", "done");

  updateStep(command, "laptop", "active");
  const laptop = findLaptopAgent();
  if (laptop) setAgentStatus(laptop, command.intent === "camera_capture" ? "capturing" : "working");
  await sleep(1400);

  if (command.intent === "camera_capture") {
    finishCommand(command, {
      type: "photo",
      url: "/jarvis/demo-photo.svg",
      message: "Demo photo (connect Windows agent for real capture)",
    });
  } else if (command.intent === "ping") {
    finishCommand(command, { type: "text", message: "Pong! Agents are reachable in demo mode." });
  } else {
    const label = intentLabel(command.intent);
    finishCommand(command, {
      type: "text",
      message: `${label.en} simulated successfully.`,
    });
  }

  if (laptop) setAgentStatus(laptop, "idle");
  setAgentStatus(getOrCreateHubAgent(), "idle");
}

function getOrCreateHubAgent(): AgentRecord {
  for (const agent of state().agents.values()) {
    if (agent.kind === "hub") return agent;
  }
  const hub: AgentRecord = {
    id: "hub_main",
    name: "Jarvis Hub",
    kind: "hub",
    token: "hub",
    status: "idle",
    lastSeen: Date.now(),
    capabilities: ["route", "parse", "notify"],
  };
  state().agents.set(hub.id, hub);
  return hub;
}

export function subscribe(listener: Listener): () => void {
  state().listeners.add(listener);
  return () => state().listeners.delete(listener);
}

export function listAgents(): AgentRecord[] {
  const now = Date.now();
  return [...state().agents.values()]
    .map((agent) => ({
      ...agent,
      token: "",
      status:
        agent.kind !== "hub" && now - agent.lastSeen > AGENT_OFFLINE_MS
          ? ("offline" as const)
          : agent.status,
    }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

export function listCommands(): JarvisCommand[] {
  return [...state().commands];
}

export function listEvents(limit = 30): JarvisEvent[] {
  return state().events.slice(0, limit);
}

export function getCommand(commandId: string): JarvisCommand | null {
  return state().commands.find((c) => c.id === commandId) ?? null;
}

export function registerAgent(input: {
  name: string;
  kind: AgentKind;
  token?: string;
}): AgentRecord {
  if (input.kind === "hub") {
    throw new Error("Hub agent cannot be registered");
  }
  const agent: AgentRecord = {
    id: id("agent"),
    name: input.name.trim() || "Agent",
    kind: input.kind,
    token: input.token?.trim() || randomBytes(16).toString("hex"),
    status: "idle",
    lastSeen: Date.now(),
    capabilities:
      input.kind === "laptop"
        ? ["camera_capture", "screenshot", "open_app", "volume"]
        : ["command", "notify"],
  };
  state().agents.set(agent.id, agent);
  pushEvent("agents", `${agent.name} connected`, `${agent.name} সংযুক্ত`, {
    agents: listAgents(),
  });
  return agent;
}

export function verifyAgent(agentId: string, token: string): AgentRecord | null {
  const agent = state().agents.get(agentId);
  if (!agent || agent.token !== token) return null;
  return agent;
}

export function heartbeat(agentId: string, token: string, status: AgentStatus = "idle") {
  const agent = verifyAgent(agentId, token);
  if (!agent) return null;
  agent.status = status;
  agent.lastSeen = Date.now();
  pushEvent("agents", `${agent.name} heartbeat`, `${agent.name} অনলাইন`, {
    agents: listAgents(),
  });
  return agent;
}

export function pollJob(agentId: string, token: string): PendingAgentJob | null {
  const agent = verifyAgent(agentId, token);
  if (!agent) return null;
  agent.lastSeen = Date.now();
  const job = state().pendingJobs.get(agentId) ?? null;
  if (job) state().pendingJobs.delete(agentId);
  return job;
}

export function submitCommand(rawText: string): JarvisCommand {
  getOrCreateHubAgent();
  const parsed = parseCommandText(rawText);
  const laptop = findLaptopAgent();

  const command: JarvisCommand = {
    id: id("cmd"),
    rawText,
    intent: parsed.intent,
    targetAgentId: laptop?.id ?? null,
    status: "queued",
    steps: defaultSteps().map((step) => stepLabelForIntent(parsed.intent, step.id)),
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    simulated: false,
  };

  state().commands.unshift(command);
  if (state().commands.length > MAX_COMMANDS) state().commands.length = MAX_COMMANDS;

  pushEvent("log", `Command: ${rawText}`, `কমান্ড: ${rawText}`, { command });
  pushEvent("command", "Command received", "কমান্ড পেয়েছে", { command });

  updateStep(command, "phone", "active");
  setAgentStatus(getOrCreateHubAgent(), "listening");

  void dispatchCommand(command, parsed, laptop);
  return command;
}

async function dispatchCommand(
  command: JarvisCommand,
  parsed: ReturnType<typeof parseCommandText>,
  laptop: AgentRecord | null,
) {
  await sleep(700);
  updateStep(command, "phone", "done");
  updateStep(command, "hub", "active");
  setAgentStatus(getOrCreateHubAgent(), "thinking");
  await sleep(800);
  updateStep(command, "hub", "done");

  if (!laptop) {
    pushEvent(
      "log",
      "No laptop agent online — running demo simulation",
      "ল্যাপটপ এজেন্ট নেই — ডেমো চলছে",
      { commandId: command.id },
    );
    await runSimulation(command);
    return;
  }

  command.status = "dispatched";
  command.targetAgentId = laptop.id;
  command.updatedAt = Date.now();
  updateStep(command, "laptop", "active");
  setAgentStatus(laptop, parsed.intent === "camera_capture" ? "capturing" : "working");

  state().pendingJobs.set(laptop.id, {
    commandId: command.id,
    intent: parsed.intent,
    payload: { appName: parsed.appName ?? null, rawText: command.rawText },
  });

  pushEvent("command", `Sent to ${laptop.name}`, `${laptop.name}-এ পাঠানো`, { command });
}

export function completeAgentJob(
  agentId: string,
  token: string,
  input: {
    commandId: string;
    success: boolean;
    message?: string;
    photoUrl?: string;
  },
): JarvisCommand | null {
  const agent = verifyAgent(agentId, token);
  if (!agent) return null;

  const pending = state().pendingJobs.get(agentId);
  if (!pending || pending.commandId !== input.commandId) return null;
  state().pendingJobs.delete(agentId);

  const command = getCommand(input.commandId);
  if (!command) return null;

  updateStep(command, "laptop", input.success ? "done" : "failed");

  if (input.success && input.photoUrl) {
    updateStep(command, "courier", "active");
    setAgentStatus(agent, "sending");
    pushEvent("log", "Sending photo to phone", "ফোনে ছবি পাঠানো হচ্ছে", {
      commandId: command.id,
    });
    updateStep(command, "courier", "done");
    finishCommand(command, { type: "photo", url: input.photoUrl, message: input.message });
  } else if (input.success) {
    finishCommand(command, { type: "text", message: input.message ?? "Done" });
  } else {
    finishCommand(command, { type: "text", message: input.message ?? "Failed" }, true);
  }

  setAgentStatus(agent, "idle");
  setAgentStatus(getOrCreateHubAgent(), "idle");
  return command;
}
