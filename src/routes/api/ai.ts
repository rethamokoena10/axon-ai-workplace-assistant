import { createFileRoute } from "@tanstack/react-router";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
} from "@/lib/aig-run-id";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { messages?: Msg[] };
        try {
          body = (await request.json()) as { messages?: Msg[] };
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const messages = (body.messages ?? []).filter(
          (m) => m && typeof m.content === "string" && m.content.trim().length > 0,
        );
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "Nothing to send to the assistant." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const gateway = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));

        try {
          const upstream = await gateway.fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            signal: request.signal,
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: "openai/gpt-6-astra",
              input: messages.map((m) => ({ role: m.role, content: m.content })),
              stream: true,
              store: false,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
            }),
          });

          if (!upstream.ok) {
            const text = await upstream.text();
            let message = text;
            try {
              const parsed = JSON.parse(text);
              message = parsed?.error?.message ?? parsed?.message ?? text;
            } catch {
              /* keep raw text */
            }
            if (upstream.status === 429) message = "Too many requests right now. Please try again in a moment.";
            if (upstream.status === 402) message = message || "AI credits are exhausted for this workspace.";
            return new Response(JSON.stringify({ error: message || "The assistant is unavailable." }), {
              status: upstream.status,
              headers: { "Content-Type": "application/json" },
            });
          }

          const headers = getLovableAiGatewayResponseHeaders(upstream.headers);
          headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "text/event-stream");
          headers.set("Cache-Control", "no-cache");
          return new Response(upstream.body, { status: upstream.status, headers });
        } catch (error) {
          if (request.signal.aborted && error instanceof Error && error.name === "AbortError") {
            return new Response(null, { status: 499 });
          }
          throw error;
        }
      },
    },
  },
});
