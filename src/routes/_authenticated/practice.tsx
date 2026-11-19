import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { AiLoading } from "@/components/app/AiLoading";
import { KeyDialog } from "@/components/app/KeyDialog";
import { QuizRunner } from "@/components/app/QuizRunner";
import { useAi } from "@/hooks/use-ai";
import { documentQuery, documentsQuery, profileQuery, saveMistakes } from "@/lib/data";
import { practiceMessages, practiceSchema, type Question } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "练题 · 知微" },
      { name: "description", content: "按知识点或精读存档出理解题，做错自动进错题本。" },
      { property: "og:title", content: "练题 · 知微" },
      { property: "og:description", content: "按知识点或精读存档出题。" },
    ],
  }),
  component: Practice,
});

const LEVELS = ["基础", "中等", "拔高"] as const;

function Practice() {
  const [source, setSource] = useState<"topic" | "doc">("topic");
  const [topic, setTopic] = useState("");
  const [docId, setDocId] = useState<string>("");
  const [count, setCount] = useState("5");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("中等");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);
  const [keyOpen, setKeyOpen] = useState(false);
  const ai = useAi();
  const qc = useQueryClient();
  const { data: docs = [] } = useQuery(documentsQuery());
  const { data: profile } = useQuery(profileQuery());
  const docTitle = docs.find((d) => d.id === docId)?.title;

  async function generate() {
    if (!ai.hasKey) return setKeyOpen(true);
    if (source === "topic" && !topic.trim()) return toast.error("先写一个知识点或章节");
    if (source === "doc" && !docId) return toast.error("先选一份精读存档");
    setBusy(true);
    try {
      let context: string | undefined;
      if (source === "doc") {
        const doc = await qc.fetchQuery(documentQuery(docId));
        context = doc?.source_text;
      }
      const res = await ai.json(
        practiceMessages({
          topic: source === "doc" ? `《${docTitle}》${topic ? `，重点：${topic}` : ""}` : topic,
          count: Number(count),
          difficulty: level,
          context,
          profile: profile ?? undefined,
        }),
        practiceSchema,
      );
      if (!res.questions.length) throw new Error("没有生成题目，换个说法试试");
      setQuestions(res.questions);
      setRound((r) => r + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "出题失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise">
      <KeyDialog open={keyOpen} onOpenChange={setKeyOpen} />
      <PageHeader eyebrow="练与复习" title="练题" desc="考理解而不是死记。做错的题会自动收进错题本，附带解析。" />
      <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="paper h-fit space-y-5 p-5">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            {(["topic", "doc"] as const).map((s) => (
              <button key={s} onClick={() => setSource(s)} className={cn("rounded px-3 py-1.5 text-sm", source === s ? "bg-card shadow-paper font-medium" : "text-muted-foreground")}>
                {s === "topic" ? "按知识点" : "按精读存档"}
              </button>
            ))}
          </div>
          {source === "doc" ? (
            <div className="space-y-1.5">
              <Label>精读存档</Label>
              <Select value={docId} onValueChange={setDocId}>
                <SelectTrigger><SelectValue placeholder={docs.length ? "选择一份" : "还没有存档"} /></SelectTrigger>
                <SelectContent>
                  {docs.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="topic">{source === "doc" ? "重点（选填）" : "知识点 / 章节"}</Label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={source === "doc" ? "例如：内生性处理" : "例如：边际效用递减、贝叶斯定理"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>题量</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["3", "5", "8", "10"].map((n) => <SelectItem key={n} value={n}>{n} 题</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>难度</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as (typeof LEVELS)[number])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={generate} disabled={busy}>{questions ? "换一组题" : "出题"}</Button>
        </div>
        <div className="min-w-0">
          {busy ? (
            <AiLoading title="正在出题…" hint="题目会考查理解、应用和辨析。" />
          ) : questions ? (
            <div className="paper p-5 md:p-7">
              <QuizRunner
                key={round}
                questions={questions}
                onFinish={async (results) => {
                  const wrong = results.filter((r) => !r.correct);
                  try {
                    await saveMistakes(wrong.map((r) => ({ ...r.question, userIndex: r.userIndex })), {
                      documentId: source === "doc" ? docId : null,
                      title: source === "doc" ? docTitle : topic,
                    });
                    if (wrong.length) qc.invalidateQueries({ queryKey: ["mistakes"] });
                  } catch {
                    toast.error("错题没能保存，请稍后重试");
                  }
                }}
              />
            </div>
          ) : (
            <div className="paper flex h-full min-h-64 flex-col items-center justify-center gap-2 p-10 text-center">
              <span className="seal h-12 w-12 text-xl">题</span>
              <p className="mt-2 font-serif text-lg">选好范围，点“出题”</p>
              <p className="text-sm text-muted-foreground">按知识点出题，或从你精读过的材料里出题。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
