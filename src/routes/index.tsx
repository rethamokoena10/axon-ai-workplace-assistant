import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, CalendarClock, BookOpen, MessagesSquare, ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Disclaimer } from "@/components/AiOutput";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AXON — AI Workplace Assistant" },
      {
        name: "description",
        content: "AXON drafts emails, plans your day, summarises research and answers workplace questions with AI.",
      },
      { property: "og:title", content: "AXON — AI Workplace Assistant" },
      {
        property: "og:description",
        content: "Draft emails, plan your day, summarise research and chat with an AI workplace assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    to: "/email",
    icon: Mail,
    title: "Smart Email Generator",
    text: "Professional emails with a clear subject line, tuned to audience and tone.",
  },
  {
    to: "/planner",
    icon: CalendarClock,
    title: "AI Task Planner",
    text: "Turn a task list into a realistic, time-blocked schedule with breaks.",
  },
  {
    to: "/research",
    icon: BookOpen,
    title: "Research Assistant",
    text: "Summarise a topic, link or pasted article into insights and next steps.",
  },
  {
    to: "/chat",
    icon: MessagesSquare,
    title: "AI Chat",
    text: "Ask anything about work — feedback, meetings, difficult conversations.",
  },
] as const;

function Dashboard() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell>
      <PageHeader title="Welcome back" description={`${today} — here's your workspace at a glance.`} />

      <div className="card-surface mb-6 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Icon className="size-4.5 text-accent-foreground" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {tool.title}
                    <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{tool.text}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Today's task overview</h2>
          <p className="mt-4 rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            No tasks planned yet. Build a time-blocked day in the Task Planner and your schedule will guide the rest of
            your work.
          </p>
          <Link
            to="/planner"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Plan my day
          </Link>
        </section>

        <section className="card-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Productivity summary</h2>
          <ul className="mt-4 space-y-3">
            {[
              { icon: Zap, label: "AI tools ready", value: "4" },
              { icon: Clock, label: "Breaks built into every plan", value: "15 min" },
              { icon: CheckCircle2, label: "Outputs you can edit and copy", value: "All" },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.label} className="flex items-center justify-between rounded-xl border border-border p-3.5">
                  <span className="flex items-center gap-2.5 text-sm">
                    <Icon className="size-4 text-primary" />
                    {row.label}
                  </span>
                  <span className="text-sm font-semibold">{row.value}</span>
                </li>
              );
            })}
          </ul>
          <Disclaimer className="mt-4" />
        </section>
      </div>
    </AppShell>
  );
}
