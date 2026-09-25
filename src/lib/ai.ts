export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Streams a completion from the app's AI endpoint.
 * Calls onDelta with each new chunk of text and resolves with the full text.
 */
export async function streamAi(
  messages: AiMessage[],
  onDelta: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = "The assistant could not respond. Please try again.";
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
            onDelta(text);
          } else if (event.type === "response.error" || event.type === "error") {
            throw new Error(event.error?.message ?? "The assistant stopped unexpectedly.");
          }
        } catch (err) {
          if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
            if (!(err instanceof SyntaxError)) throw err;
          }
        }
      }
    }
  }

  if (!text.trim()) throw new Error("The assistant returned an empty response. Please try again.");
  return text;
}
