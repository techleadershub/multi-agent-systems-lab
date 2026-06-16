// Helper to build an SSE-style stream of JSON events.

export function makeSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  function send(event: object) {
    if (!controller) return;
    const chunk = `data: ${JSON.stringify(event)}\n\n`;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      /* connection closed */
    }
  }

  function close() {
    if (!controller) return;
    try {
      controller.close();
    } catch {
      /* already closed */
    }
    controller = null;
  }

  return { stream, send, close };
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
