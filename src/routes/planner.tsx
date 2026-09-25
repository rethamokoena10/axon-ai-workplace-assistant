import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AiOutputCard } from "@/components/AiOutput";
import { ChipGroup } from "@/components/Chips";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { streamAi } from "@/lib/ai";
import { cn } from "@/lib/utils";

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
const priorities = ["Auto", "High", "Medium", "Low"] as const;
type Priority = (typeof priorities)[number];
type Task = { id: number; name: string; priority: Priority; duration: string; deadline: string };

let nextId = 1;
const newTask = (): Task => ({ id: nextId++, name: "", priority: "Auto", duration: "", deadline: "" });

const SYSTEM_PROMPT = `You are a pragmatic productivity planner. Build a realistic, time-blocked schedule in service of the user's goal.

Rules:
- Respect every priority the user set. For tasks marked "Auto", assign High / Medium / Low by urgency and importance relative to the goal and deadlines.
- Respect any duration given; otherwise allocate a realistic duration.
- Schedule High first, deep work in the mornings where possible, and every task before its deadline.
- Put every task in an explicit clock-time block (e.g. 09:00–10:30) with its priority tag, e.g. [High].
- Insert a 15-minute break after roughly every 90 minutes of focus, plus a lunch break on full days.
- Never exceed the available working hours. Keep each day to about 85% focused load so it stays realistic. For weekly plans, spread work across weekdays (Mon–Fri) and never overload a single day.
- Never silently force an unrealistic schedule. If tasks conflict (overlapping fixed times, deadlines that can't be met, total time exceeding capacity), schedule only what fits and flag the rest.

Output exactly these sections, using short headings, bullets and time blocks only (no paragraphs, no preamble):
## 📋 Task Breakdown
- Task — [Priority] — Duration — Deadline (if any) — 1 short reason
## 🗓️ Schedule
(For weekly: a ### heading per day.) One line per block: \`HH:MM–HH:MM · Task [Priority]\` and \`HH:MM–HH:MM · ☕ Break\`
## ⚡ Time-Optimisation Tips
- 2–4 specific tips (batching, time-boxing, sequencing, what to prep ahead)
## ⚠️ Conflicts & Decisions Needed
- Only if there are conflicts: state each conflict clearly, suggest which task to move, delegate or eliminate and why, then end with a direct question asking what the user would like to do. If none, write "None — this plan fits your hours."`;

function PlannerPage() {
  const [goal, setGoal] = useState("");
  const [tasks, setTasks] = useState<Task[]>(() => [newTask(), newTask(), newTask()]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [range, setRange] = useState<(typeof ranges)[number]>("Daily");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filled = tasks.filter((t) => t.name.trim());
  const update = (id: number, patch: Partial<Task>) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function generate() {
    if (!filled.length || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    const taskLines = filled
      .map(
        (t, i) =>
          `${i + 1}. ${t.name.trim()} | Priority: ${t.priority}${t.duration.trim() ? ` | Duration: ${t.duration.trim()}` : ""}${t.deadline ? ` | Deadline: ${t.deadline}` : ""}`,
      )
      .join("\n");
    try {
      await streamAi(
        [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Goal: ${goal.trim() || "Not specified — infer the most sensible goal from the tasks"}\nPlan type: ${range}\nStart date: ${date}\nWorking hours: ${start} to ${end}${range === "Weekly" ? " each weekday" : ""}\nTasks:\n${taskLines}\n${notes.trim() ? `Fixed meetings / constraints: ${notes.trim()}` : ""}`,
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
        description="Add your tasks, priorities and hours — AXON builds a realistic schedule with breaks and flags anything that won't fit."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface space-y-5 p-5 sm:p-6">
          <ChipGroup label="Plan type" options={ranges} value={range} onChange={setRange} />

          <div className="space-y-2">
            <span className="text-sm font-medium">Goal (optional)</span>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Ship the Q3 report to leadership by Friday"
              className="bg-card"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tasks</span>
              <span className="text-xs text-muted-foreground">{filled.length} added</span>
            </div>
            {tasks.map((t, i) => (
              <div key={t.id} className="space-y-2.5 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={t.name}
                    onChange={(e) => update(t.id, { name: e.target.value })}
                    placeholder={`Task ${i + 1}, e.g. Finish Q3 report`}
                    className="bg-card"
                  />
                  <button
                    type="button"
                    aria-label="Remove task"
                    onClick={() => setTasks((ts) => (ts.length > 1 ? ts.filter((x) => x.id !== t.id) : [newTask()]))}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {priorities.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update(t.id, { priority: p })}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        t.priority === p
                          ? "border-mint-strong bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Duration (optional)
                    <Input
                      value={t.duration}
                      onChange={(e) => update(t.id, { duration: e.target.value })}
                      placeholder="e.g. 90 min"
                      className="bg-card text-foreground"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Deadline (optional)
                    <Input
                      type="date"
                      value={t.deadline}
                      onChange={(e) => update(t.id, { deadline: e.target.value })}
                      className="bg-card text-foreground"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTasks((ts) => [...ts, newTask()])}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-4" /> Add task
            </button>
            <p className="text-xs text-muted-foreground">"Auto" lets AXON set the priority based on your goal and deadlines.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              {range === "Weekly" ? "Week starting" : "Date"}
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
            disabled={loading || !filled.length}
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
          rows={24}
          emptyHint="Your prioritised, time-blocked plan will appear here — with breaks, tips and any conflicts flagged."
        />
      </div>
    </AppShell>
  );
}
