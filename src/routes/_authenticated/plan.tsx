import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { AiLoading } from "@/components/app/AiLoading";
import { KeyDialog } from "@/components/app/KeyDialog";
import { useAi } from "@/hooks/use-ai";
import { mistakesQuery, plansQuery, profileQuery } from "@/lib/data";
import { planMessages, planSchema } from "@/lib/prompts";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "学习计划 · 知微" },
      { name: "description", content: "根据目标、考试日期和每天可用时间，排出可执行的分日学习计划。" },
      { property: "og:title", content: "学习计划 · 知微" },
      { property: "og:description", content: "排出可执行的分日学习计划。" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState("2");
  const [weak, setWeak] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const ai = useAi();
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery(plansQuery());
  const { data: mistakes = [] } = useQuery(mistakesQuery());
  const { data: profile } = useQuery(profileQuery());

  async function generate() {
    if (!ai.hasKey) return setKeyOpen(true);
    if (!goal.trim()) return toast.error("先写下你的目标");
    setBusy(true);
    try {
      const autoWeak = mistakes.filter((m) => !m.mastered).slice(0, 8).map((m) => m.source_title).filter(Boolean).join("、");
      const plan = await ai.json(
        planMessages({
          goal,
          examDate: examDate || undefined,
          hoursPerDay: Number(hours) || 2,
          today: new Date().toLocaleDateString("zh-CN"),
          weakPoints: weak || (autoWeak ? `错题集中在：${autoWeak}` : undefined),
          profile: profile ?? undefined,
        }),
        planSchema,
      );
      const { error } = await supabase.from("study_plans").insert({ goal, exam_date: examDate || null, hours_per_day: Number(hours) || 2, plan: plan as unknown as Json });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["plans"] });
      setGoal(""); setWeak("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise">
      <KeyDialog open={keyOpen} onOpenChange={setKeyOpen} />
      <PageHeader eyebrow="练与复习" title="学习计划" desc="先建框架再补细节，间隔复习，留出缓冲。勾选完成的任务，进度会保存。" />
      <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="paper h-fit space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="goal">目标</Label>
            <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例如：计量经济学期末 85 分" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">截止日期</Label>
              <Input id="date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">每天小时</Label>
              <Input id="hours" type="number" min="0.5" max="12" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weak">薄弱点（选填）</Label>
            <Textarea id="weak" value={weak} onChange={(e) => setWeak(e.target.value)} placeholder="不填会参考你的错题本" className="min-h-20" />
          </div>
          <Button className="w-full" onClick={generate} disabled={busy}>生成计划</Button>
        </div>
        <div className="min-w-0 space-y-6">
          {busy ? <AiLoading title="正在排计划…" /> : null}
          {plans.length === 0 && !busy ? (
            <div className="paper flex min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
              <span className="seal h-12 w-12 text-xl">计</span>
              <p className="mt-2 font-serif text-lg">还没有计划</p>
              <p className="text-sm text-muted-foreground">写下目标和截止日期，排一份能执行的分日计划。</p>
            </div>
          ) : null}
          {plans.map((p) => <PlanCard key={p.id} row={p} />)}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ row }: { row: { id: string; goal: string; exam_date: string | null; plan: unknown; done: unknown } }) {
  const plan = planSchema.parse(row.plan ?? {});
  const [done, setDone] = useState<string[]>(Array.isArray(row.done) ? (row.done as string[]) : []);
  const qc = useQueryClient();
  const total = plan.days.reduce((n, d) => n + d.tasks.length, 0);

  async function toggle(key: string) {
    const next = done.includes(key) ? done.filter((k) => k !== key) : [...done, key];
    setDone(next);
    await supabase.from("study_plans").update({ done: next }).eq("id", row.id);
  }

  return (
    <article className="paper p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{row.goal}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{row.exam_date ? `截止 ${row.exam_date} · ` : ""}完成 {done.length} / {total}</p>
        </div>
        <button aria-label="删除计划" className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("study_plans").delete().eq("id", row.id); qc.invalidateQueries({ queryKey: ["plans"] }); }}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${total ? (done.length / total) * 100 : 0}%` }} />
      </div>
      {plan.summary ? <p className="prose-read mt-4 text-sm text-foreground/80">{plan.summary}</p> : null}
      <ol className="mt-5 space-y-4">
        {plan.days.map((d, i) => (
          <li key={i} className="grid gap-3 border-l-2 border-primary/30 pl-4 sm:grid-cols-[140px_1fr]">
            <div>
              <p className="font-serif font-semibold">{d.day}</p>
              <p className="text-xs text-muted-foreground">{d.minutes} 分钟</p>
            </div>
            <div>
              <p className="text-sm font-medium">{d.focus}</p>
              <ul className="mt-2 space-y-1.5">
                {d.tasks.map((t, k) => {
                  const key = `${i}-${k}`;
                  const isDone = done.includes(key);
                  return (
                    <li key={key}>
                      <button onClick={() => toggle(key)} className="flex items-start gap-2 text-left text-sm">
                        <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", isDone && "border-jade bg-jade text-ink-foreground")}>
                          {isDone ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className={cn(isDone && "text-muted-foreground line-through")}>{t}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      {plan.tips.length ? (
        <div className="mt-5 rounded-md bg-jade-soft p-4 text-sm text-jade">
          {plan.tips.map((t, i) => <p key={i}>· {t}</p>)}
        </div>
      ) : null}
    </article>
  );
}
