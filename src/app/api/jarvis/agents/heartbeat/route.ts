import { NextResponse } from "next/server";
import { heartbeat } from "@/lib/jarvis/store";
import type { AgentStatus } from "@/lib/jarvis/types";

export async function POST(request: Request) {
  let body: { agentId?: string; token?: string; status?: AgentStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agentId, token, status = "idle" } = body;
  if (!agentId || !token) {
    return NextResponse.json({ error: "agentId and token required" }, { status: 400 });
  }

  const agent = heartbeat(agentId, token, status);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, agent: { id: agent.id, status: agent.status } });
}
