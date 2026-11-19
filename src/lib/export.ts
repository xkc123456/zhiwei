import type { Analysis } from "@/lib/prompts";

export function analysisToMarkdown(a: Analysis, kindLabel: string) {
  const L: string[] = [];
  L.push(`---\ntitle: "${a.title.replace(/"/g, "'")}"\ntype: ${kindLabel}\ndiscipline: ${a.discipline}\ntags: [知微, 澄读]\n---`, "");
  L.push(`# ${a.title}`, "", `> ${a.oneLiner}`, "");
  L.push("## 老师讲解", "");
  a.steps.forEach((s, i) => {
    L.push(`### ${i + 1}. ${s.heading}`, "", s.explain, "");
    if (s.analogy) L.push(`**换个日常说法**：${s.analogy}`, "");
    if (s.evidence) L.push(`> 原文依据：「${s.evidence}」`, "");
  });
  if (a.keyPoints.length) L.push("## 要点", "", ...a.keyPoints.map((k) => `- ${k}`), "");
  if (a.terms.length) L.push("## 术语", "", ...a.terms.map((t) => `- **${t.term}**：${t.definition}`), "");
  if (a.relations.length) L.push("## 主体关系", "", ...a.relations.map((r) => `- ${r.from} —${r.relation}→ ${r.to}`), "");
  if (a.comparison?.columns.length) {
    L.push(`## ${a.comparison.title || "分栏对照"}`, "", `| ${a.comparison.columns.join(" | ")} |`, `| ${a.comparison.columns.map(() => "---").join(" | ")} |`);
    a.comparison.rows.forEach((r) => L.push(`| ${r.join(" | ")} |`));
    L.push("");
  }
  if (a.caveats.length) L.push("## 阅读警示", "", ...a.caveats.map((c) => `- ${c}`), "");
  return L.join("\n");
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
