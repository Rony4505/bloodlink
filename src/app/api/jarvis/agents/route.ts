import { NextResponse } from "next/server";
import { listAgents, registerAgent } from "@/lib/jarvis/store";
import type { AgentKind } from "@/lib/jarvis/types";

export async function GET() {
  return NextResponse.json({ agents: listAgents() });
}

export async function POST(request: Request) {
  let body: { name?: string; kind?: AgentKind; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = body.kind;
  if (kind !== "phone" && kind !== "laptop") {
    return NextResponse.json({ error: "kind must be phone or laptop" }, { status: 400 });
  }

  const agent = registerAgent({
    name: body.name ?? (kind === "laptop" ? "Windows Laptop" : "iPhone"),
    kind,
    token: body.token,
  });

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      kind: agent.kind,
      token: agent.token,
      status: agent.status,
      capabilities: agent.capabilities,
    },
    agents: listAgents(),
  });
}
