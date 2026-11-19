import { ArrowRight } from "lucide-react";
import type { Analysis } from "@/lib/prompts";

export function Relations({ analysis }: { analysis: Analysis }) {
  const nodes = Array.from(new Set(analysis.relations.flatMap((r) => [r.from, r.to]).filter(Boolean)));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {nodes.map((n) => (
          <span key={n} className="rounded-full border bg-card px-3 py-1 text-sm">{n}</span>
        ))}
      </div>
      <ul className="space-y-2">
        {analysis.relations.map((r, i) => (
          <li key={i} className="paper flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="rounded-md bg-ink px-2.5 py-1 text-ink-foreground">{r.from}</span>
            <span className="flex items-center gap-1 text-primary">
              <span className="text-xs font-medium">{r.relation}</span>
              <ArrowRight className="h-4 w-4" />
            </span>
            <span className="rounded-md bg-ochre-soft px-2.5 py-1">{r.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
