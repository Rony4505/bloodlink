import { NextResponse } from "next/server";
import { completeAgentJob } from "@/lib/jarvis/store";

export async function POST(request: Request) {
  let body: {
    agentId?: string;
    token?: string;
    commandId?: string;
    success?: boolean;
    message?: string;
    photoUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agentId, token, commandId, success, message, photoUrl } = body;
  if (!agentId || !token || !commandId || typeof success !== "boolean") {
    return NextResponse.json(
      { error: "agentId, token, commandId, and success required" },
      { status: 400 },
    );
  }

  const command = completeAgentJob(agentId, token, {
    commandId,
    success,
    message,
    photoUrl,
  });

  if (!command) {
    return NextResponse.json({ error: "Unauthorized or unknown command" }, { status: 400 });
  }

  return NextResponse.json({ command });
}
