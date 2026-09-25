import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AiOutputCard } from "@/components/AiOutput";
import { ChipGroup } from "@/components/Chips";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { streamAi } from "@/lib/ai";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AXON" },
      { name: "description", content: "Turn your task list into a realistic, time-blocked day or week with breaks." },
      { property: "og:title", content: "AI Task Planner — AXON" },
      { property: "og:description", content: "Prioritised, time-blocked schedules that never overload your day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

const ranges = ["Daily", "Weekly"] as const;

function PlannerPage() {
  const [tasks, setTasks] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [range, setRange] = useState<(typeof ranges)[number]>("Daily");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!tasks.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    try {
      await streamAi(
        [
          {
            role: "system",
            content:
              "You are a pragmatic productivity planner. Build a realistic, time-blocked schedule. Rules: prioritise by impact and deadline; place every task in an explicit clock-time block (e.g. 09:00–10:30); include a 15-minute break after roughly every 90 minutes of focus and a lunch break in a full day; never exceed the available working hours; protect deep work in the morning where possible. If the tasks cannot reasonably fit, schedule what fits and end with a section '⚠️ Needs a decision' that names specific tasks to move, delegate or drop, and asks the user which. Output must be structured and scannable: short headings, time blocks, bullet points. No long paragraphs, no preamble.",
          },
          {
            role: "user",
            content: `Plan type: ${range}\nStart date: ${date}\nWorking hours: ${start} to ${end}\nTasks (with any priorities or deadlines):\n${tasks}\n${notes ? `Extra constraints: ${notes}` : ""}`,
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
        title="AI Task Planner"
        description="Add your tasks and hours — AXON prioritises them into a realistic schedule with breaks."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <span className="text-sm font-medium">Tasks</span>
            <Textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              rows={7}
              placeholder={
                "One task per line, e.g.\nFinish Q3 report — high priority, due today\nReview 3 pull requests\nClient call prep (30 min)"
              }
              className="bg-card text-sm"
            />
            <p className="text-xs text-muted-foreground">Add durations, priorities or deadlines for a sharper plan.</p>
          </div>

          <ChipGroup label="Plan type" options={ranges} value={range} onChange={setRange} />

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              Date
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Start
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="bg-card" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              End
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-card" />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Fixed meetings or constraints (optional)</span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Standup 09:15–09:30 daily, no meetings after 15:00"
              className="bg-card text-sm"
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading || !tasks.trim()}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Building schedule…" : "Build my schedule"}
          </button>
        </section>

        <AiOutputCard
          title="Your schedule"
          value={output}
          onChange={setOutput}
          loading={loading}
          error={error}
          rows={20}
          emptyHint="Your time-blocked plan will appear here, ready to edit and copy."
        />
      </div>
    </AppShell>
  );
}
