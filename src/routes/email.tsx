import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AiOutputCard } from "@/components/AiOutput";
import { ChipGroup } from "@/components/Chips";
import { Textarea } from "@/components/ui/textarea";
import { streamAi } from "@/lib/ai";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AXON" },
      { name: "description", content: "Write clear, professional work emails with the right tone in seconds." },
      { property: "og:title", content: "Smart Email Generator — AXON" },
      { property: "og:description", content: "Generate a complete work email with a clear subject line." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const audiences = ["Client", "Manager", "Team"] as const;
const tones = ["Formal", "Friendly", "Persuasive", "Assertive"] as const;

function EmailPage() {
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState<(typeof audiences)[number]>("Client");
  const [tone, setTone] = useState<(typeof tones)[number]>("Formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!purpose.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      await streamAi(
        [
          {
            role: "system",
            content:
              "You are an expert business communication writer. Write a complete, ready-to-send workplace email. Start with a line beginning exactly with 'Subject: ' that clearly states the purpose of the email. Then a greeting, a concise body (short paragraphs or bullet points), a clear call to action, and a sign-off with [Your Name]. Never include commentary, options, or markdown headings. Keep it tight and professional.",
          },
          {
            role: "user",
            content: `Write an email.\nAudience: ${audience}\nTone: ${tone}\nPurpose / content to cover:\n${purpose}`,
          },
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
        title="Smart Email Generator"
        description="Describe what you need to say — AXON writes the full email, subject line included."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <span className="text-sm font-medium">What is this email about?</span>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={7}
              placeholder="e.g. Let the client know the launch moves from 12 to 19 March, explain the reason (extra QA), and confirm the new review call."
              className="bg-card text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: include the key facts, dates and the action you want from the reader.
            </p>
          </div>

          <ChipGroup label="Audience" options={audiences} value={audience} onChange={setAudience} />
          <ChipGroup label="Tone" options={tones} value={tone} onChange={setTone} />

          <button
            type="button"
            onClick={generate}
            disabled={loading || !purpose.trim()}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate email"}
          </button>
        </section>

        <AiOutputCard
          title="Generated email"
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          emptyHint="Your email will appear here, fully editable before you copy it."
        />
      </div>
    </AppShell>
  );
}
