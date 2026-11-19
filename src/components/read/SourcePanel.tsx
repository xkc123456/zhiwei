import { useEffect, useMemo, useRef } from "react";

function locate(text: string, quote: string): [number, number] | null {
  const q = quote.replace(/[「」“”"]/g, "").trim();
  if (!q) return null;
  let idx = text.indexOf(q);
  if (idx >= 0) return [idx, idx + q.length];
  const compactText = text.replace(/\s+/g, "");
  for (const len of [24, 16, 10]) {
    if (q.length < len) continue;
    const probe = q.slice(0, len);
    idx = text.indexOf(probe);
    if (idx >= 0) return [idx, idx + Math.min(q.length, text.length - idx)];
    if (compactText.includes(probe.replace(/\s+/g, ""))) {
      // Fall back: highlight first char occurrence of probe start
      const first = text.indexOf(probe.slice(0, 4));
      if (first >= 0) return [first, first + len];
    }
  }
  return null;
}

export function SourcePanel({ text, quote, className }: { text: string; quote: string | null; className?: string }) {
  const markRef = useRef<HTMLElement>(null);
  const range = useMemo(() => (quote ? locate(text, quote) : null), [text, quote]);

  useEffect(() => {
    markRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [range]);

  return (
    <div className={className}>
      {quote && !range ? (
        <p className="mb-3 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
          没有在原文中找到完全一致的句子，这条依据可能是模型的转述，请对照原文核实。
        </p>
      ) : null}
      <div className="prose-read whitespace-pre-wrap text-sm text-foreground/85">
        {range ? (
          <>
            {text.slice(0, range[0])}
            <mark ref={markRef} className="mark-hit text-foreground">{text.slice(range[0], range[1])}</mark>
            {text.slice(range[1])}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
