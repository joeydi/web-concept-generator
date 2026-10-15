import Anthropic from "@anthropic-ai/sdk";
import type { StreamEvent } from "../types";

/** Own errors are shown as-is; SDK/network internals are replaced with a safe message. */
function publicMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError || (err instanceof Error && /authentication method/i.test(err.message))) {
    return "The server has no valid Anthropic API key configured.";
  }
  if (err instanceof Anthropic.RateLimitError) return "The model is busy right now. Try again in a minute.";
  if (err instanceof Anthropic.APIError) return `The model request failed (${err.status ?? "network"}). Try again.`;
  return err instanceof Error ? err.message : "Something went wrong";
}

/** Wrap an async job in a text/event-stream Response. `send` writes one event. */
export function sseResponse(job: (send: (e: StreamEvent) => void) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`)); } catch { /* client went away */ }
      };
      try {
        await job(send);
      } catch (err) {
        send({ type: "error", message: publicMessage(err) });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store, no-transform", "x-accel-buffering": "no" },
  });
}

/** Tracks step timing and emits running/done events for an ordered list of steps. */
export function stepper(send: (e: StreamEvent) => void) {
  const started = new Map<number, number>();
  return {
    start(i: number) {
      started.set(i, Date.now());
      send({ type: "step", index: i, status: "running" });
    },
    done(i: number) {
      const t = started.get(i) ?? Date.now();
      send({ type: "step", index: i, status: "done", ms: Date.now() - t });
    },
  };
}
