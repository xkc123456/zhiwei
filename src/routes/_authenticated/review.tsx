import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { cardsQuery } from "@/lib/data";
import { schedule, type Grade } from "@/lib/srs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "记忆卡片 · 知微" },
      { name: "description", content: "按遗忘曲线安排的每日复习卡片。" },
      { property: "og:title", content: "记忆卡片 · 知微" },
      { property: "og:description", content: "按遗忘曲线安排每日复习。" },
    ],
  }),
  component: Review,
});

const GRADES: { g: Grade; label: string; hint: string; variant: "outline" | "default" | "jade" | "ink" }[] = [
  { g: "again", label: "忘了", hint: "10 分钟后", variant: "outline" },
  { g: "hard", label: "模糊", hint: "稍后再见", variant: "ink" },
  { g: "good", label: "记得", hint: "按计划", variant: "default" },
  { g: "easy", label: "很熟", hint: "拉长间隔", variant: "jade" },
];

function Review() {
  const { data: cards = [], isLoading } = useQuery(cardsQuery());
  const qc = useQueryClient();
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const due = useMemo(() => cards.filter((c) => new Date(c.due_at) <= new Date()), [cards]);
  const card = due[0];

  async function grade(g: Grade) {
    if (!card) return;
    const next = schedule(card, g);
    await supabase.from("review_cards").update(next).eq("id", card.id);
    setFlipped(false);
    setDoneCount((n) => n + 1);
    await qc.invalidateQueries({ queryKey: ["cards"] });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const { error } = await supabase.from("review_cards").insert({ front: front.trim(), back: back.trim() });
    if (error) {
      toast.error("添加失败");
      return;
    }
    setFront(""); setBack("");
    qc.invalidateQueries({ queryKey: ["cards"] });
    toast.success("已添加，今天就会出现");
  }

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="练与复习" title="记忆卡片" desc={`今天待复习 ${due.length} 张，共 ${cards.length} 张。按遗忘曲线安排，答得越熟，间隔越长。`} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {isLoading ? <p className="text-sm text-muted-foreground">加载中…</p> : card ? (
            <div className="space-y-5">
              <button
                onClick={() => setFlipped((f) => !f)}
                className="paper flex min-h-72 w-full flex-col items-center justify-center gap-4 p-8 text-center transition-shadow hover:shadow-lift"
              >
                <p className="font-serif text-3xl font-bold">{card.front}</p>
                {flipped ? (
                  <p className="prose-read max-w-lg animate-rise whitespace-pre-wrap text-foreground/80">{card.back}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">先在心里回答，再点击翻面</p>
                )}
              </button>
              {flipped ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GRADES.map((g) => (
                    <Button key={g.g} variant={g.variant} className="h-auto flex-col gap-0 py-3" onClick={() => grade(g.g)}>
                      <span className="text-base">{g.label}</span>
                      <span className="text-[11px] opacity-70">{g.hint}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <Button className="w-full" variant="ink" onClick={() => setFlipped(true)}>翻面</Button>
              )}
              <p className="text-center text-xs text-muted-foreground">本次已复习 {doneCount} 张 · 还剩 {due.length} 张</p>
            </div>
          ) : (
            <div className="paper flex min-h-72 flex-col items-center justify-center gap-3 p-10 text-center">
              <span className="seal h-12 w-12 text-xl">毕</span>
              <p className="font-serif text-lg">{cards.length ? "今天的复习完成了" : "还没有卡片"}</p>
              <p className="text-sm text-muted-foreground">
                {cards.length ? "明天再来，记忆会更牢。" : <>在精读页点“术语做成卡片”，或在右侧手动添加。 <Link to="/library" className="text-primary hover:underline">去存档</Link></>}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <form onSubmit={add} className="paper space-y-3 p-5">
            <p className="font-semibold">手动添加卡片</p>
            <Input value={front} onChange={(e) => setFront(e.target.value)} placeholder="正面：问题或术语" />
            <Textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="背面：答案或解释" className="min-h-24" />
            <Button type="submit" variant="outline" className="w-full"><Plus /> 添加</Button>
          </form>
          {cards.length ? (
            <div className="paper max-h-96 divide-y overflow-y-auto">
              {cards.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="flex-1 truncate">{c.front}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.due_at) <= new Date() ? "今天" : new Date(c.due_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</span>
                  <button aria-label="删除卡片" className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("review_cards").delete().eq("id", c.id); qc.invalidateQueries({ queryKey: ["cards"] }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
