import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/prompts";

export type QuizResult = { question: Question; userIndex: number; correct: boolean };

/** One-question-at-a-time quiz. Calls onFinish with every answer when the last question is answered. */
export function QuizRunner({
  questions,
  onFinish,
  finishLabel = "完成",
}: {
  questions: Question[];
  onFinish?: (results: QuizResult[]) => void | Promise<void>;
  finishLabel?: string;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [done, setDone] = useState(false);

  if (!questions.length) return <p className="text-sm text-muted-foreground">暂无题目。</p>;

  if (done) {
    const right = results.filter((r) => r.correct).length;
    return (
      <div className="space-y-4">
        <div className="paper flex items-center gap-4 p-5">
          <span className="seal h-14 w-14 text-xl">{Math.round((right / results.length) * 100)}</span>
          <div>
            <p className="font-serif text-lg font-semibold">答对 {right} / {results.length}</p>
            <p className="text-sm text-muted-foreground">
              {right === results.length ? "全部答对，理解很扎实。" : "做错的题已收进错题本，可以随时重做。"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { setI(0); setPicked(null); setResults([]); setDone(false); }}>
          <RotateCcw /> 再做一遍
        </Button>
      </div>
    );
  }

  const q = questions[i]!;
  const answered = picked !== null;

  async function next() {
    if (picked === null) return;
    const all = [...results, { question: q, userIndex: picked, correct: picked === q.answerIndex }];
    setResults(all);
    if (i + 1 < questions.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setDone(true);
      await onFinish?.(all);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>第 {i + 1} / {questions.length} 题</span>
        <div className="flex gap-1">
          {questions.map((_, k) => (
            <span key={k} className={cn("h-1.5 w-6 rounded-full", k < i ? "bg-primary" : k === i ? "bg-primary/50" : "bg-border")} />
          ))}
        </div>
      </div>
      <p className="font-serif text-lg font-semibold leading-relaxed">{q.question}</p>
      <div className="grid gap-2">
        {q.options.map((o, k) => {
          const isRight = k === q.answerIndex;
          const isPicked = k === picked;
          return (
            <button
              key={k}
              disabled={answered}
              onClick={() => setPicked(k)}
              className={cn(
                "paper flex items-start gap-3 p-3 text-left text-sm transition-colors",
                !answered && "hover:bg-paper-deep",
                answered && isRight && "border-jade bg-jade-soft",
                answered && isPicked && !isRight && "border-destructive bg-accent",
              )}
            >
              <span className="mt-px font-serif font-bold text-muted-foreground">{"ABCDEF"[k]}</span>
              <span className="flex-1">{o}</span>
              {answered && isRight ? <Check className="h-4 w-4 text-jade" /> : null}
              {answered && isPicked && !isRight ? <X className="h-4 w-4 text-destructive" /> : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="space-y-3 animate-rise">
          <p className="evidence p-3 text-sm leading-relaxed">{q.explanation}</p>
          <Button onClick={next}>{i + 1 < questions.length ? "下一题" : finishLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
