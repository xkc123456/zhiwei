import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Clock, Download, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KeyDialog } from "@/components/app/KeyDialog";
import { QuizRunner } from "@/components/app/QuizRunner";
import { Explain } from "@/components/read/Explain";
import { Terms } from "@/components/read/Terms";
import { Relations } from "@/components/read/Relations";
import { Comparison } from "@/components/read/Comparison";
import { Retell } from "@/components/read/Retell";
import { Chat } from "@/components/read/Chat";
import { SourcePanel } from "@/components/read/SourcePanel";
import { documentQuery, profileQuery, saveMistakes } from "@/lib/data";
import { KIND_LABEL } from "@/lib/prompts";
import { analysisToMarkdown, downloadText } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/read/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(documentQuery(params.id)),
  head: () => ({
    meta: [
      { title: "精读 · 澄读 · 知微" },
      { name: "description", content: "逐层拆解：老师讲解、术语、主体关系、自测、复述检验与追问。" },
      { property: "og:title", content: "精读 · 澄读 · 知微" },
      { property: "og:description", content: "逐层拆解你的学习材料。" },
    ],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const { id } = Route.useParams();
  const { data: doc } = useSuspenseQuery(documentQuery(id));
  const { data: profile } = useQuery(profileQuery());
  const [quote, setQuote] = useState<string | null>(null);
  const [tab, setTab] = useState("explain");
  const [keyOpen, setKeyOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (!doc) {
    return (
      <div className="paper p-10 text-center">
        <p className="font-serif text-lg">没有找到这份精读</p>
        <Button asChild className="mt-4"><Link to="/library">回到存档</Link></Button>
      </div>
    );
  }
  const a = doc.analysis;

  function locate(q: string) {
    setQuote(q);
    if (window.matchMedia("(max-width: 1279px)").matches) setTab("source");
  }

  async function termsToCards() {
    if (!a.terms.length) return;
    const { error } = await supabase.from("review_cards").insert(
      a.terms.map((t) => ({ document_id: doc!.id, front: t.term, back: t.definition + (t.example ? `\n例：${t.example}` : "") })),
    );
    if (error) {
      toast.error("加入失败，请重试");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["cards"] });
    toast.success(`已把 ${a.terms.length} 个术语加入记忆卡片`, { action: { label: "去复习", onClick: () => navigate({ to: "/review" }) } });
  }

  async function remove() {
    await supabase.from("documents").delete().eq("id", doc!.id);
    await qc.invalidateQueries({ queryKey: ["documents"] });
    navigate({ to: "/library" });
  }

  return (
    <div className="animate-rise">
      <KeyDialog open={keyOpen} onOpenChange={setKeyOpen} />
      <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 我的存档
      </Link>

      <header className="mt-4 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-primary px-2 py-0.5 font-medium text-primary-foreground">{KIND_LABEL[doc.kind]}</span>
            {a.discipline ? <span className="rounded border px-2 py-0.5">{a.discipline}</span> : null}
            {a.paperType ? <span className="rounded border px-2 py-0.5">{a.paperType}</span> : null}
            <span className="rounded bg-ochre-soft px-2 py-0.5">{a.difficulty}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> 建议精读 {a.minutes} 分钟</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{doc.title}</h1>
          <p className="prose-read mt-3 text-lg text-foreground/80">{a.oneLiner}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={termsToCards}><Layers /> 术语做成卡片</Button>
          <Button variant="outline" size="sm" onClick={() => downloadText(`${doc.title}.md`, analysisToMarkdown(a, KIND_LABEL[doc.kind]))}>
            <Download /> 导出 Markdown
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" aria-label="删除"><Trash2 /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除这份精读？</AlertDialogTitle>
                <AlertDialogDescription>原文、拆解和追问记录都会删除，相关的记忆卡片也会一起删除。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {a.keyPoints.length ? (
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {a.keyPoints.map((k, i) => (
            <li key={i} className="flex gap-3 rounded-md bg-card px-4 py-3 text-sm shadow-paper">
              <span className="font-serif font-bold text-primary">{i + 1}</span>{k}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">以上解读由 AI 生成，仅供学习参考，请以原文为准。</p>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["explain", "老师讲解"],
              ["terms", `术语 ${a.terms.length}`],
              ["relations", "主体关系"],
              ["compare", "分栏对照"],
              ["quiz", "自测"],
              ["retell", "复述检验"],
              ["chat", "追问"],
              ["source", "原文"],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v!}
                className={`rounded-full border border-border bg-card px-4 py-1.5 data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-ink-foreground ${v === "source" ? "xl:hidden" : ""}`}
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-6">
            <TabsContent value="explain"><Explain analysis={a} onLocate={locate} /></TabsContent>
            <TabsContent value="terms"><Terms analysis={a} /></TabsContent>
            <TabsContent value="relations"><Relations analysis={a} /></TabsContent>
            <TabsContent value="compare"><Comparison analysis={a} /></TabsContent>
            <TabsContent value="quiz">
              <div className="paper p-5 md:p-6">
                <QuizRunner
                  questions={a.quiz}
                  onFinish={async (results) => {
                    const wrong = results.filter((r) => !r.correct);
                    try {
                      await saveMistakes(
                        wrong.map((r) => ({ ...r.question, userIndex: r.userIndex })),
                        { documentId: doc.id, title: doc.title },
                      );
                      if (wrong.length) qc.invalidateQueries({ queryKey: ["mistakes"] });
                    } catch {
                      toast.error("错题没能保存，请稍后重试");
                    }
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="retell"><Retell analysis={a} onNeedKey={() => setKeyOpen(true)} /></TabsContent>
            <TabsContent value="chat">
              <Chat docId={doc.id} kind={doc.kind} sourceText={doc.source_text} analysis={a} initial={doc.chat} profile={profile ?? undefined} onNeedKey={() => setKeyOpen(true)} />
            </TabsContent>
            <TabsContent value="source" className="xl:hidden">
              <SourcePanel text={doc.source_text} quote={quote} className="paper max-h-[75vh] overflow-y-auto p-5" />
            </TabsContent>
          </div>
        </Tabs>
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <p className="mb-2 text-xs font-semibold tracking-[0.25em] text-muted-foreground">原文对照</p>
            <SourcePanel text={doc.source_text} quote={quote} className="paper max-h-[calc(100vh-6rem)] overflow-y-auto p-5" />
          </div>
        </aside>
      </div>
    </div>
  );
}
