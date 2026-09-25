import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AiOutputCard } from "@/components/AiOutput";
import { ChipGroup } from "@/components/Chips";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { streamAi } from "@/lib/ai";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — AXON" },
      { name: "description", content: "Summarise a topic, link or pasted article into key insights and next steps." },
      { property: "og:title", content: "AI Research Assistant — AXON" },
      { property: "og:description", content: "Fast summaries, key points and practical recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

const modes = ["Topic", "URL", "Pasted text"] as const;

function ResearchPage() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Topic");
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = mode === "Topic" ? topic : mode === "URL" ? url : text;

  async function generate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");

    const source =
      mode === "Topic"
        ? `Research topic: ${topic}`
        : mode === "URL"
          ? `Source link (you cannot open it — work from what the link and its title suggest, and clearly flag anything you are unsure about): ${url}`
          : `Article text to analyse:\n"""\n${text}\n"""`;

    try {
      await streamAi(
        [
          {
            role: "system",
            content:
              "You are a sharp research analyst for busy professionals. Respond in this exact structure with short bullet points, never long paragraphs:\nSummary\n- 3-5 bullets\n\nKey Insights\n- 3-5 bullets\n\nImportant Points to Watch\n- 3-4 bullets\n\nPractical Recommendations\n- 3-5 concrete, actionable bullets\n\nState uncertainty plainly instead of inventing facts, statistics or quotes. No markdown headers beyond the plain section names.",
          },
          { role: "user", content: source },
        ],
        setOutput,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="AI Research Assistant"
        description="Give AXON a topic, a link or an article — get a summary, insights and next steps."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface space-y-5 p-5 sm:p-6">
          <ChipGroup label="Source" options={modes} value={mode} onChange={setMode} />

          {mode === "Topic" && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Topic or question</span>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={5}
                placeholder="e.g. How are mid-size agencies using AI for client reporting in 2026?"
                className="bg-card text-sm"
              />
            </div>
          )}

          {mode === "URL" && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Article URL</span>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                For the most accurate result, paste the article text instead of the link.
              </p>
            </div>
          )}

          {mode === "Pasted text" && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Paste the article</span>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder="Paste the full text you want summarised…"
                className="bg-card text-sm"
              />
            </div>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={loading || !input.trim()}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analysing…" : "Run research"}
          </button>
        </section>

        <AiOutputCard
          title="Research brief"
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          rows={20}
          emptyHint="Your summary, insights and recommendations will appear here."
        />
      </div>
    </AppShell>
  );
}
