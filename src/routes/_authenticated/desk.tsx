import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, CalendarRange, KeyRound, Layers, NotebookPen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyDialog } from "@/components/app/KeyDialog";
import { cardsQuery, documentsQuery, mistakesQuery, plansQuery, profileQuery } from "@/lib/data";
import { useAiSettings } from "@/lib/ai-settings";
import { KIND_LABEL } from "@/lib/prompts";

export const Route = createFileRoute("/_authenticated/desk")({
  head: () => ({
    meta: [
      { title: "书桌 · 知微" },
      { name: "description", content: "今天要复习的卡片、最近的精读和待重做的错题。" },
      { property: "og:title", content: "书桌 · 知微" },
      { property: "og:description", content: "你的学习书桌。" },
    ],
  }),
  component: Desk,
});

function greet() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 19) return "下午好";
  return "晚上好";
}

function Desk() {
  const { data: profile } = useQuery(profileQuery());
  const { data: docs = [] } = useQuery(documentsQuery());
  const { data: cards = [] } = useQuery(cardsQuery());
  const { data: mistakes = [] } = useQuery(mistakesQuery());
  const { data: plans = [] } = useQuery(plansQuery());
  const settings = useAiSettings();
  const due = cards.filter((c) => new Date(c.due_at) <= new Date()).length;
  const openMistakes = mistakes.filter((m) => !m.mastered).length;

  const stats = [
    { to: "/review" as const, icon: Layers, n: due, t: "张卡片待复习", cta: "开始复习" },
    { to: "/mistakes" as const, icon: NotebookPen, n: openMistakes, t: "道错题未掌握", cta: "去重做" },
    { to: "/library" as const, icon: BookOpenText, n: docs.length, t: "份精读存档", cta: "查看存档" },
  ];

  return (
    <div className="animate-rise space-y-10">
      <div>
        <p className="eyebrow">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{greet()}，{profile?.display_name || "同学"}。</h1>
        <p className="mt-2 text-muted-foreground">今天想读懂什么？</p>
      </div>

      {!settings.apiKey ? (
        <div className="paper flex flex-col gap-4 border-primary/40 p-5 sm:flex-row sm:items-center">
          <KeyRound className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">先连接你的 DeepSeek</p>
            <p className="text-sm text-muted-foreground">知微的解析、出题和追问都使用你自己的 Key，只保存在这台设备的浏览器里。</p>
          </div>
          <KeyDialog trigger={<Button>填写 Key</Button>} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Link to="/read/new" className="group relative overflow-hidden rounded-xl bg-ink p-7 text-ink-foreground shadow-lift">
          <p className="text-xs tracking-[0.3em] text-ink-foreground/60">澄读</p>
          <h2 className="mt-3 text-2xl font-bold">放一篇论文、一章教材或一份课件进来</h2>
          <p className="mt-2 text-sm text-ink-foreground/70">先抓问题，再看机制，最后核对证据。</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground">
            开始精读 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <span className="seal absolute -right-4 -top-4 h-24 w-24 rotate-12 text-4xl opacity-80">读</span>
        </Link>
        <div className="grid gap-3">
          <Link to="/practice" className="paper flex items-center gap-4 p-5 hover:shadow-lift">
            <PenLine className="h-5 w-5 text-primary" />
            <div className="flex-1"><p className="font-semibold">按主题练题</p><p className="text-xs text-muted-foreground">输入一个知识点，马上出题</p></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/plan" className="paper flex items-center gap-4 p-5 hover:shadow-lift">
            <CalendarRange className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">学习计划</p>
              <p className="text-xs text-muted-foreground">{plans[0] ? `当前：${plans[0].goal}` : "给考试或论文排个分日计划"}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.to} to={s.to} className="paper group p-5 hover:shadow-lift">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-serif text-4xl font-black">{s.n}</p>
            <p className="text-sm text-muted-foreground">{s.t}</p>
            <p className="mt-3 text-xs font-medium text-primary group-hover:underline">{s.cta} →</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">最近的精读</h2>
          <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">全部 →</Link>
        </div>
        {docs.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {docs.slice(0, 4).map((d) => (
              <Link key={d.id} to="/read/$id" params={{ id: d.id }} className="paper p-4 hover:shadow-lift">
                <p className="text-xs text-muted-foreground">{KIND_LABEL[d.kind]}{d.discipline ? ` · ${d.discipline}` : ""}</p>
                <p className="mt-1 line-clamp-1 font-serif font-semibold">{d.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.oneLiner}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="paper p-6 text-sm text-muted-foreground">还没有精读记录。放进第一份材料，它会出现在这里。</p>
        )}
      </section>
    </div>
  );
}
