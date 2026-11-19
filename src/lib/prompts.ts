import { z } from "zod";

export type DocKind = "paper" | "textbook" | "slides";

export const KIND_LABEL: Record<DocKind, string> = {
  paper: "学术论文",
  textbook: "教材章节",
  slides: "讲义课件",
};

export type LearnerProfile = {
  school?: string | null | undefined;
  major?: string | null | undefined;
  degree?: string | null | undefined;
};

const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);

export const analysisSchema = z.object({
  title: str,
  discipline: str,
  oneLiner: str,
  difficulty: z.enum(["入门", "进阶", "挑战"]).catch("进阶"),
  minutes: z.number().catch(10),
  paperType: str,
  steps: z
    .array(z.object({ heading: str, explain: str, analogy: str, evidence: str, inferred: z.boolean().catch(false) }))
    .catch([]),
  terms: z.array(z.object({ term: str, definition: str, example: str })).catch([]),
  relations: z.array(z.object({ from: str, relation: str, to: str })).catch([]),
  comparison: z
    .object({ title: str, columns: strArr, rows: z.array(strArr).catch([]) })
    .nullable()
    .catch(null),
  keyPoints: strArr,
  caveats: strArr,
  quiz: z
    .array(
      z.object({
        question: str,
        options: strArr,
        answerIndex: z.number().int().catch(0),
        explanation: str,
      }),
    )
    .catch([]),
  retellPrompt: str,
});
export type Analysis = z.infer<typeof analysisSchema>;

export const retellSchema = z.object({
  score: z.number().catch(0),
  verdict: str,
  covered: strArr,
  missed: strArr,
  misconceptions: strArr,
  suggestion: str,
});
export type RetellFeedback = z.infer<typeof retellSchema>;

export const questionSchema = z.object({
  question: str,
  options: strArr,
  answerIndex: z.number().int().catch(0),
  explanation: str,
});
export type Question = z.infer<typeof questionSchema>;
export const practiceSchema = z.object({ questions: z.array(questionSchema).catch([]) });

export const planSchema = z.object({
  summary: str,
  days: z
    .array(z.object({ day: str, focus: str, minutes: z.number().catch(60), tasks: strArr }))
    .catch([]),
  tips: strArr,
});
export type StudyPlan = z.infer<typeof planSchema>;

type Msg = { role: "system" | "user" | "assistant"; content: string };

export const MAX_SOURCE_CHARS = 40_000;

function learnerLine(p?: LearnerProfile | undefined) {
  const parts = [p?.degree, p?.school, p?.major].filter(Boolean);
  return parts.length ? `读者是${parts.join(" · ")}的学生，讲解请贴合他的专业背景。` : "读者是本科生。";
}

const KIND_FOCUS: Record<DocKind, string> = {
  paper:
    "这是一篇学术论文。按“先抓问题 → 再看机制 → 最后核对证据”的顺序拆解：研究问题（X 是否影响 Y）、理论机制、数据与方法、核心结果、因果边界与局限。先判断论文类型（实证研究 / 规范研究 / 系统与实验 / 综述），再按类型抓重点。",
  textbook:
    "这是一段教材章节。按“这一节要解决什么 → 核心概念 → 推导或论证过程 → 典型例题思路 → 易错点”的顺序拆解，像老师备课一样讲清楚前后知识的衔接。",
  slides:
    "这是一份讲义/课件，内容常常是要点式、不完整的。请还原老师上课的讲授逻辑，把省略的推理补上，并标注哪些是你补充的推断（inferred=true）。",
};

export function analysisMessages(kind: DocKind, text: string, profile?: LearnerProfile | undefined): Msg[] {
  return [
    {
      role: "system",
      content: `你是一位耐心的大学老师，擅长把难懂的材料讲成学生听得懂、能复述的话。${learnerLine(profile)}
${KIND_FOCUS[kind]}
要求：
- 用简体中文，口语化但准确，不堆砌术语；每个讲解步骤配一个日常类比。
- evidence 字段必须是从原文中逐字摘录的一句话（不超过 60 字），用于原文定位；如果原文没有直接依据，evidence 留空并把 inferred 设为 true。
- 区分原文证据与推断，caveats 中列出阅读时要警惕的地方（如关联≠因果、样本局限）。
- 如果材料适合分栏对比（如分组、方法、观点、条件），给出 comparison 表格；不适合则为 null。
- quiz 出 4 道单选题，考查理解而不是记忆，每题 4 个选项。
只输出 JSON，结构如下：
{"title":"","discipline":"学科","oneLiner":"一句话说清这份材料想说明什么","difficulty":"入门|进阶|挑战","minutes":建议精读分钟数,"paperType":"类型",
"steps":[{"heading":"","explain":"","analogy":"","evidence":"","inferred":false}],
"terms":[{"term":"","definition":"","example":""}],
"relations":[{"from":"主体或变量","relation":"关系","to":"主体或变量"}],
"comparison":{"title":"","columns":[""],"rows":[[""]]},
"keyPoints":[""],"caveats":[""],
"quiz":[{"question":"","options":["","","",""],"answerIndex":0,"explanation":""}],
"retellPrompt":"请学生用自己的话复述的引导问题"}
steps 4-6 个，terms 4-10 个，relations 3-8 条。`,
    },
    { role: "user", content: `材料原文：\n\n${text.slice(0, MAX_SOURCE_CHARS)}` },
  ];
}

export function retellMessages(analysis: Analysis, retell: string): Msg[] {
  return [
    {
      role: "system",
      content: `你是阅卷老师。根据材料的要点，评价学生的复述：是否抓住了核心问题、机制和证据，是否有误解。语气鼓励但直接。
只输出 JSON：{"score":0-100,"verdict":"一句话总评","covered":["说到的要点"],"missed":["漏掉的要点"],"misconceptions":["误解"],"suggestion":"下一步怎么补"}`,
    },
    {
      role: "user",
      content: `材料：${analysis.title}\n一句话：${analysis.oneLiner}\n要点：\n${analysis.keyPoints.map((k) => `- ${k}`).join("\n")}\n讲解：\n${analysis.steps.map((s) => `- ${s.heading}：${s.explain}`).join("\n")}\n\n引导问题：${analysis.retellPrompt}\n\n学生的复述：\n${retell}`,
    },
  ];
}

export function chatSystemMessage(kind: DocKind, text: string, analysis: Analysis, profile?: LearnerProfile | undefined): Msg {
  return {
    role: "system",
    content: `你是陪学生精读${KIND_LABEL[kind]}的老师。${learnerLine(profile)}回答学生的追问，尽量引用原文（用「」标出原句），分清哪些是原文、哪些是你的推断。回答简洁，必要时分点。可以使用 Markdown。
材料标题：${analysis.title}
原文（节选）：
${text.slice(0, 24_000)}`,
  };
}

export function practiceMessages(opts: {
  topic: string;
  count: number;
  difficulty: string;
  context?: string | undefined;
  profile?: LearnerProfile | undefined;
}): Msg[] {
  return [
    {
      role: "system",
      content: `你是出题老师。${learnerLine(opts.profile)}出 ${opts.count} 道单选题，难度：${opts.difficulty}。考查理解、应用和辨析，避免只考记忆；选项要有迷惑性；解析说明为什么对、其他选项错在哪。
只输出 JSON：{"questions":[{"question":"","options":["","","",""],"answerIndex":0,"explanation":""}]}`,
    },
    {
      role: "user",
      content: opts.context
        ? `出题范围：${opts.topic}\n参考材料：\n${opts.context.slice(0, 20_000)}`
        : `出题范围：${opts.topic}`,
    },
  ];
}

export function planMessages(opts: {
  goal: string;
  examDate?: string | undefined;
  hoursPerDay: number;
  today: string;
  weakPoints?: string | undefined;
  profile?: LearnerProfile | undefined;
}): Msg[] {
  return [
    {
      role: "system",
      content: `你是学习规划老师。${learnerLine(opts.profile)}根据目标、剩余时间和每日可用时长，制定切实可行的分日计划。遵循“先建框架再补细节、间隔复习、留出缓冲日”的原则。最多 14 天，若时间更长则按阶段概括为 14 个条目。
只输出 JSON：{"summary":"整体策略","days":[{"day":"第1天 · 日期","focus":"主题","minutes":分钟数,"tasks":["具体任务"]}],"tips":["建议"]}`,
    },
    {
      role: "user",
      content: `今天：${opts.today}\n目标：${opts.goal}\n考试/截止日期：${opts.examDate || "未定"}\n每天可学习：${opts.hoursPerDay} 小时\n薄弱点：${opts.weakPoints || "未说明"}`,
    },
  ];
}

/** Pulls the first JSON object out of a model reply (handles ```json fences). */
export function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型返回的内容不是有效的结构化结果，请重试。");
  return JSON.parse(raw.slice(start, end + 1));
}
