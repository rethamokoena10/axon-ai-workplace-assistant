import { useEffect, useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      AI-generated content may contain errors. Review important information before using or sending it.
    </p>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
        } catch {
          toast.error("Copying isn't available in this browser");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function OutputSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

type AiOutputProps = {
  title: string;
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error?: string | null;
  emptyHint: string;
  rows?: number;
};

export function AiOutputCard({ title, value, onChange, loading, error, emptyHint, rows = 16 }: AiOutputProps) {
  const showSkeleton = loading && !value;

  return (
    <section className="ai-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              Generating…
            </span>
          )}
          {value && !loading && <CopyButton text={value} />}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/8 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : showSkeleton ? (
        <OutputSkeleton />
      ) : value ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="resize-y border-border bg-card text-sm leading-relaxed whitespace-pre-wrap"
        />
      ) : (
        <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">{emptyHint}</p>
      )}

      <Disclaimer className="mt-4" />
    </section>
  );
}
