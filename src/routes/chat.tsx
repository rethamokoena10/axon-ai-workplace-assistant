import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CopyButton, Disclaimer } from "@/components/AiOutput";
import { Textarea } from "@/components/ui/textarea";
import { streamAi, type AiMessage } from "@/lib/ai";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat — AXON" },
      { name: "description", content: "Ask an AI assistant anything about work: feedback, meetings, tricky emails." },
      { property: "og:title", content: "AI Workplace Chat — AXON" },
      { property: "og:description", content: "A workplace chatbot for everyday professional questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const SYSTEM: AiMessage = {
  role: "system",
  content:
    "You are AXON, a calm, practical AI workplace assistant. Give specific, professional, actionable answers. Prefer short paragraphs and bullet points over walls of text. Ask a clarifying question when the request is ambiguous. Never invent company policy or facts — say when something depends on the user's organisation.",
};

const starters = [
  "How do I give critical feedback to a teammate?",
  "Help me decline a meeting invite politely.",
  "Write an agenda for a 30-minute project kickoff.",
  "How should I prioritise when everything is urgent?",
];

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const replyId = crypto.randomUUID();
    const history = [...messages, userMsg];
    setMessages([...history, { id: replyId, role: "assistant", content: "" }]);
    setLoading(true);

    try {
      await streamAi(
        [SYSTEM, ...history.map((m) => ({ role: m.role, content: m.content }) as AiMessage)],
        (full) => setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, content: full } : m))),
      );
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== replyId));
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="AI Chat" description="Your workplace assistant — ask anything about your working day." />

      <section className="card-surface flex h-[68vh] min-h-[480px] flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent">
                <Sparkles className="size-5 text-accent-foreground" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                Start a conversation, or try one of these workplace prompts.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl bg-accent px-4 py-2.5 text-sm whitespace-pre-wrap text-accent-foreground">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="ai-surface max-w-[92%] p-4">
                {m.content ? (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    {!loading && (
                      <div className="mt-3">
                        <CopyButton text={m.content} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                    AXON is thinking…
                  </span>
                )}
              </div>
            ),
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/8 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={2}
              placeholder="Ask a workplace question…"
              className="min-h-0 resize-none bg-card text-sm"
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={loading || !input.trim()}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </button>
          </div>
          <Disclaimer className="mt-3" />
        </div>
      </section>
    </AppShell>
  );
}
