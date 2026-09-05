import { NextResponse } from "next/server";
import { listAgents, listCommands, submitCommand } from "@/lib/jarvis/store";

export async function GET() {
  return NextResponse.json({
    agents: listAgents(),
    commands: listCommands(),
  });
}

export async function POST(request: Request) {
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const command = submitCommand(text);
  return NextResponse.json({ command, agents: listAgents() });
}
