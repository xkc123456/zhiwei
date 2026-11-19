import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { mistakesQuery, type MistakeRow } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mistakes")({
  head: () => ({
    meta: [
      { title: "错题本 · 知微" },
      { name: "description", content: "做错的题都在这里，重做到掌握为止。" },
      { property: "og:title", content: "错题本 · 知微" },
      { property: "og:description", content: "做错的题，重做到掌握为止。" },
    ],
  }),
  component: Mistakes,
});

function MistakeCard({ m }: { m: MistakeRow }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["mistakes"] });

  async function answer(k: number) {
    setPicked(k);
    setReveal(true);
    const right = k === m.answer_index;
    await supabase.from("mistakes").update({ attempts: m.attempts + 1, user_index: k, ...(right ? { mastered: true } : {}) }).eq("id", m.id);
    if (right) toast.success("答对了，已标记为掌握");
    refresh();
  }

  return (
    <article className={cn("paper p-5", m.mastered && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">{m.source_title || "练题"} · 做过 {m.attempts} 次</p>
        <div className="flex gap-1">
          {m.mastered ? <span className="rounded bg-jade-soft px-2 py-0.5 text-xs text-jade">已掌握</span> : null}
          <button aria-label="删除" className="rounded p-1 text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("mistakes").delete().eq("id", m.id); refresh(); }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 font-serif font-semibold leading-relaxed">{m.question}</p>
      <div className="mt-3 grid gap-1.5">
        {m.options.map((o, k) => {
          const right = k === m.answer_index;
          const was = !reveal && k === m.user_index;
          return (
            <button
              key={k}
              disabled={reveal}
              onClick={() => answer(k)}
              className={cn(
                "flex items-start gap-2 rounded-md border bg-background/60 px-3 py-2 text-left text-sm",
                !reveal && "hover:bg-paper-deep",
                reveal && right && "border-jade bg-jade-soft",
                reveal && picked === k && !right && "border-destructive bg-accent",
              )}
            >
              <span className="font-serif font-bold text-muted-foreground">{"ABCDEF"[k]}</span>
              <span className="flex-1">{o}</span>
              {was ? <span className="text-[10px] text-primary">上次选的</span> : null}
              {reveal && right ? <Check className="h-4 w-4 text-jade" /> : null}
              {reveal && picked === k && !right ? <X className="h-4 w-4 text-destructive" /> : null}
            </button>
          );
        })}
      </div>
      {reveal ? (
        <div className="mt-3 space-y-2">
          {m.explanation ? <p className="evidence p-3 text-sm">{m.explanation}</p> : null}
          <Button variant="ghost" size="sm" onClick={() => { setReveal(false); setPicked(null); }}><RotateCcw /> 再做一次</Button>
        </div>
      ) : (
        <button className="mt-3 text-xs text-muted-foreground hover:text-primary" onClick={() => setReveal(true)}>直接看答案</button>
      )}
    </article>
  );
}

function Mistakes() {
  const { data = [], isLoading } = useQuery(mistakesQuery());
  const [filter, setFilter] = useState<"open" | "all">("open");
  const list = filter === "open" ? data.filter((m) => !m.mastered) : data;
  return (
    <div className="animate-rise">
      <PageHeader eyebrow="练与复习" title="错题本" desc={`共 ${data.length} 道，未掌握 ${data.filter((m) => !m.mastered).length} 道。重做答对即标记为掌握。`}
        actions={
          <div className="flex gap-1">
            {(["open", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full border px-3 py-1.5 text-sm", filter === f ? "border-ink bg-ink text-ink-foreground" : "bg-card")}>
                {f === "open" ? "未掌握" : "全部"}
              </button>
            ))}
          </div>
        }
      />
      {isLoading ? <p className="text-sm text-muted-foreground">加载中…</p> : list.length ? (
        <div className="grid gap-4 lg:grid-cols-2">{list.map((m) => <MistakeCard key={m.id} m={m} />)}</div>
      ) : (
        <div className="paper p-10 text-center text-muted-foreground">{data.length ? "全部掌握了，漂亮。" : "还没有错题。去练题或在精读里做自测吧。"}</div>
      )}
    </div>
  );
}
