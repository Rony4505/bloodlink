export type AgentKind = "phone" | "laptop" | "hub";

export type AgentStatus =
  | "offline"
  | "idle"
  | "listening"
  | "thinking"
  | "working"
  | "capturing"
  | "sending";

export type CommandStatus =
  | "queued"
  | "dispatched"
  | "running"
  | "completed"
  | "failed";

export type CommandIntent =
  | "camera_capture"
  | "screenshot"
  | "open_app"
  | "volume_mute"
  | "volume_up"
  | "volume_down"
  | "ping"
  | "unknown";

export type StepStatus = "pending" | "active" | "done" | "failed";

export interface AgentRecord {
  id: string;
  name: string;
  kind: AgentKind;
  token: string;
  status: AgentStatus;
  lastSeen: number;
  capabilities: string[];
}

export interface CommandStep {
  id: string;
  agentKind: AgentKind;
  label: string;
  labelBn: string;
  status: StepStatus;
}

export interface CommandResult {
  type: "photo" | "text";
  url?: string;
  message?: string;
}

export interface JarvisCommand {
  id: string;
  rawText: string;
  intent: CommandIntent;
  targetAgentId: string | null;
  status: CommandStatus;
  steps: CommandStep[];
  result: CommandResult | null;
  createdAt: number;
  updatedAt: number;
  simulated: boolean;
}

export type JarvisEventType =
  | "agents"
  | "command"
  | "step"
  | "photo"
  | "log";

export interface JarvisEvent {
  id: string;
  type: JarvisEventType;
  message: string;
  messageBn: string;
  payload?: unknown;
  timestamp: number;
}

export interface ParsedCommand {
  intent: CommandIntent;
  targetKind: AgentKind;
  appName?: string;
}

export interface PendingAgentJob {
  commandId: string;
  intent: CommandIntent;
  payload: Record<string, unknown>;
}
