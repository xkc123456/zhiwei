import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAi } from "@/hooks/use-ai";
import { supabase } from "@/integrations/supabase/client";
import { chatSystemMessage, type Analysis, type DocKind, type LearnerProfile } from "@/lib/prompts";
import type { ChatMsg } from "@/lib/data";
import { cn } from "@/lib/utils";

const SUGGEST = ["这篇最容易被误解的地方是什么？", "如果要我在课堂上汇报，提纲怎么写？", "作者的方法有什么局限？", "用一个例子帮我再讲一遍核心机制"];

export function Chat({
  docId, kind, sourceText, analysis, initial, profile, onNeedKey,
}: {
  docId: string; kind: DocKind; sourceText: string; analysis: Analysis; initial: ChatMsg[];
  profile?: LearnerProfile | undefined; onNeedKey: () => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(initial);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ai = useAi();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, busy]);

  async function send(q: string) {
    if (!q.trim()) return;
    if (!ai.hasKey) return onNeedKey();
    const next: ChatMsg[] = [...msgs, { role: "user", content: q.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await ai.text([chatSystemMessage(kind, sourceText, analysis, profile), ...next.slice(-12)], 2000);
      const all: ChatMsg[] = [...next, { role: "assistant", content: reply }];
      setMsgs(all);
      await supabase.from("documents").update({ chat: all }).eq("id", docId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提问失败");
      setMsgs(msgs);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {msgs.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-sm hover:border-primary hover:text-primary">{s}</button>
            ))}
          </div>
        ) : null}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
              m.role === "user" ? "bg-ink text-ink-foreground" : "paper prose-read [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_strong]:text-primary [&_ul]:list-disc [&_ul]:pl-5",
            )}>
              {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
        {busy ? <p className="animate-pulse text-sm text-muted-foreground">老师正在翻原文…</p> : null}
        <div ref={endRef} />
      </div>
      <form className="paper flex items-end gap-2 p-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
          placeholder="读到哪里不懂，直接问……（Enter 发送）"
          className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="发送"><SendHorizonal /></Button>
      </form>
    </div>
  );
}
