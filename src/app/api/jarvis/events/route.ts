import { listAgents, listCommands, listEvents, subscribe } from "@/lib/jarvis/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({
        type: "snapshot",
        agents: listAgents(),
        commands: listCommands(),
        events: listEvents(),
      });

      const unsubscribe = subscribe((event) => {
        send({ type: "event", event, agents: listAgents(), commands: listCommands() });
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 20_000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // @ts-expect-error — attach cleanup for client disconnect
      controller.signal?.addEventListener?.("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
