import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiLoading } from "@/components/app/AiLoading";
import { useAi } from "@/hooks/use-ai";
import { retellMessages, retellSchema, type Analysis, type RetellFeedback } from "@/lib/prompts";

export function Retell({ analysis, onNeedKey }: { analysis: Analysis; onNeedKey: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<RetellFeedback | null>(null);
  const ai = useAi();

  async function check() {
    if (!ai.hasKey) return onNeedKey();
    if (text.trim().length < 30) return toast.error("多写几句，至少 30 字。");
    setBusy(true);
    try {
      setFb(await ai.json(retellMessages(analysis, text), retellSchema));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "检验失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="evidence p-4 text-sm leading-relaxed">
        <span className="font-semibold">复述题：</span>{analysis.retellPrompt || "不看原文，用你自己的话讲讲这份材料在说什么、凭什么这么说。"}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="合上原文，像讲给同学听一样写下来……" className="prose-read min-h-40 bg-background/60" />
      <Button onClick={check} disabled={busy}>检验我的复述</Button>
      {busy ? <AiLoading title="老师正在批阅…" /> : null}
      {fb && !busy ? (
        <div className="paper animate-rise space-y-4 p-5">
          <div className="flex items-center gap-4">
            <span className="seal h-14 w-14 text-xl">{Math.round(fb.score)}</span>
            <p className="font-serif text-lg font-semibold">{fb.verdict}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "说到了", items: fb.covered, c: "text-jade" },
              { t: "漏掉了", items: fb.missed, c: "text-ochre" },
              { t: "理解偏差", items: fb.misconceptions, c: "text-primary" },
            ].map((g) => (
              <div key={g.t}>
                <p className={`text-sm font-semibold ${g.c}`}>{g.t}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
                  {g.items.length ? g.items.map((x, i) => <li key={i}>· {x}</li>) : <li className="text-muted-foreground">无</li>}
                </ul>
              </div>
            ))}
          </div>
          {fb.suggestion ? <p className="rounded-md bg-jade-soft px-4 py-3 text-sm text-jade">下一步：{fb.suggestion}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
