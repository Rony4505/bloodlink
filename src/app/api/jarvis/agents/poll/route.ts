import { NextResponse } from "next/server";
import { pollJob, verifyAgent } from "@/lib/jarvis/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  const token = searchParams.get("token");

  if (!agentId || !token) {
    return NextResponse.json({ error: "agentId and token required" }, { status: 400 });
  }

  if (!verifyAgent(agentId, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = pollJob(agentId, token);
  return NextResponse.json({ job });
}
