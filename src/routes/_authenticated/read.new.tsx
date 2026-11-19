import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { BookMarked, FileText, Presentation, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { AiLoading } from "@/components/app/AiLoading";
import { KeyDialog } from "@/components/app/KeyDialog";
import { useAi, MissingKeyError } from "@/hooks/use-ai";
import { analysisMessages, analysisSchema, KIND_LABEL, MAX_SOURCE_CHARS, type DocKind } from "@/lib/prompts";
import { extractTextFromFile } from "@/lib/extract-text";
import { profileQuery } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/read/new")({
  head: () => ({
    meta: [
      { title: "开始精读 · 澄读 · 知微" },
      { name: "description", content: "把论文、教材章节或讲义课件放进来，澄读帮你逐层拆解。" },
      { property: "og:title", content: "开始精读 · 澄读 · 知微" },
      { property: "og:description", content: "论文、教材、课件精读拆解。" },
    ],
  }),
  component: NewReading,
});

const KINDS: { k: DocKind; icon: typeof FileText; d: string }[] = [
  { k: "paper", icon: FileText, d: "问题 → 机制 → 证据 → 因果边界" },
  { k: "textbook", icon: BookMarked, d: "概念 → 推导 → 例题思路 → 易错点" },
  { k: "slides", icon: Presentation, d: "还原讲授逻辑，补全省略的推理" },
];

function NewReading() {
  const [kind, setKind] = useState<DocKind>("paper");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [running, setRunning] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ai = useAi();
  const { data: profile } = useQuery(profileQuery());
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function onFile(file: File) {
    setExtracting(true);
    try {
      const t = await extractTextFromFile(file);
      if (!t) throw new Error("没有从文件里识别出文字（可能是扫描版图片）。");
      setText(t);
      setFileName(file.name);
      toast.success(`已识别 ${t.length.toLocaleString()} 字，可以先校对再解析`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "文件读取失败");
    } finally {
      setExtracting(false);
    }
  }

  async function run() {
    if (text.trim().length < 200) return toast.error("内容太短了，至少放 200 字。");
    if (!ai.hasKey) return setKeyOpen(true);
    setRunning(true);
    try {
      const analysis = await ai.json(analysisMessages(kind, text, profile ?? undefined), analysisSchema);
      const { data, error } = await supabase
        .from("documents")
        .insert({
          kind,
          title: analysis.title || fileName || "未命名材料",
          discipline: analysis.discipline || null,
          source_text: text.slice(0, MAX_SOURCE_CHARS),
          analysis: analysis as unknown as Json,
        })
        .select("id")
        .single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/read/$id", params: { id: data.id } });
    } catch (e) {
      if (e instanceof MissingKeyError) setKeyOpen(true);
      else toast.error(e instanceof Error ? e.message : "解析失败，请重试");
      setRunning(false);
    }
  }

  if (running) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <AiLoading title="正在逐层拆解…" hint="先抓问题，再看机制，最后核对证据。长文大约需要 30–90 秒，请不要关闭页面。" />
      </div>
    );
  }

  const over = text.length > MAX_SOURCE_CHARS;

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="澄读" title="把材料放进来" desc="选择材料类型，澄读会换一套拆法。识别后可以先校对文字，再开始解析，避免重复调用。" />
      <KeyDialog open={keyOpen} onOpenChange={setKeyOpen} />

      <div className="grid gap-3 sm:grid-cols-3">
        {KINDS.map((it) => (
          <button
            key={it.k}
            onClick={() => setKind(it.k)}
            className={cn(
              "paper flex items-start gap-3 p-4 text-left transition-all",
              kind === it.k ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
            )}
          >
            <it.icon className={cn("mt-0.5 h-5 w-5", kind === it.k ? "text-primary" : "text-muted-foreground")} />
            <span>
              <span className="block font-semibold">{KIND_LABEL[it.k]}</span>
              <span className="text-xs text-muted-foreground">{it.d}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="paper mt-6 p-4 md:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{fileName ? `来自：${fileName}` : "材料文字"}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={extracting}>
            <Upload /> {extracting ? "识别中…" : "上传 PDF / Word / TXT"}
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴论文、教材章节或课件的文字……"
          className="prose-read min-h-[320px] resize-y bg-background/60"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className={cn("text-xs", over ? "text-destructive" : "text-muted-foreground")}>
            {text.length.toLocaleString()} / {MAX_SOURCE_CHARS.toLocaleString()} 字
            {over ? " · 超出部分不会被解析" : " · 长文耗时更久"}
          </p>
          <Button size="lg" onClick={run} disabled={!text.trim()}>
            开始精读拆解
          </Button>
        </div>
      </div>
      {!ai.hasKey ? (
        <p className="mt-4 text-sm text-muted-foreground">
          还没连接 DeepSeek？
          <button className="text-primary hover:underline" onClick={() => setKeyOpen(true)}>填写你的 Key</button>
          ，只保存在这台设备的浏览器里。
        </p>
      ) : null}
    </div>
  );
}
