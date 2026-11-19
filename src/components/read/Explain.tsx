import { Quote, Sparkles } from "lucide-react";
import type { Analysis } from "@/lib/prompts";

export function Explain({ analysis, onLocate }: { analysis: Analysis; onLocate: (q: string) => void }) {
  return (
    <div className="space-y-8">
      {analysis.steps.map((s, i) => (
        <article key={i} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl font-black text-primary/30">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-xl font-semibold">{s.heading}</h3>
          </div>
          <p className="prose-read mt-3 text-foreground/90">{s.explain}</p>
          {s.analogy ? (
            <div className="mt-3 rounded-md bg-jade-soft px-4 py-3 text-sm leading-relaxed text-jade">
              <span className="font-semibold">换个日常说法　</span>
              {s.analogy}
            </div>
          ) : null}
          {s.evidence ? (
            <button onClick={() => onLocate(s.evidence)} className="evidence mt-3 flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:brightness-95">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
              <span className="flex-1">
                <span className="mr-2 text-xs font-semibold text-ochre">原文依据 · 点击定位</span>「{s.evidence}」
              </span>
            </button>
          ) : s.inferred ? (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> 这一步是根据上下文补充的推断，原文没有直接对应的句子。
            </p>
          ) : null}
        </article>
      ))}
      {analysis.caveats.length ? (
        <div className="paper p-5">
          <h4 className="font-semibold">阅读时要警惕</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {analysis.caveats.map((c, i) => <li key={i} className="flex gap-2"><span className="text-primary">·</span>{c}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
