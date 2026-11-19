import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CalendarRange,
  FileSearch,
  Layers,
  MessagesSquare,
  NotebookPen,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brand";
import heroInk from "@/assets/hero-ink.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "知微 · 把论文、教材和课件读成听得懂的课" },
      {
        name: "description",
        content: "知微是面向大学生的 AI 学习台：澄读精读论文、教材和课件，配合自测、复述检验、错题本、记忆卡片和学习计划。",
      },
      { property: "og:title", content: "知微 · 把论文、教材和课件读成听得懂的课" },
      { property: "og:description", content: "澄读精读 + 练题 + 错题本 + 间隔复习 + 学习计划，一张书桌搞定。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);
  return signedIn;
}

const STEPS = [
  { n: "一", t: "先抓问题", d: "这份材料究竟想回答什么" },
  { n: "二", t: "再看机制", d: "结论是怎样一步步推出来的" },
  { n: "三", t: "核对证据", d: "哪些是原文，哪些只是推断" },
];

const MODULES = [
  { icon: BookOpenText, t: "澄读 · 精读", d: "论文、教材章节、讲义课件，拆成老师讲解、术语、主体关系与分栏对照。" },
  { icon: FileSearch, t: "原文定位", d: "每条讲解附原文依据，一点就跳回原句，推断会单独标注。" },
  { icon: MessagesSquare, t: "追问老师", d: "读到不懂的地方继续问，回答会引用原文、区分推断。" },
  { icon: PenLine, t: "练题与复述", d: "自动出理解题；用自己的话复述，AI 指出漏掉的要点。" },
  { icon: NotebookPen, t: "错题本", d: "做错的题自动收进来，附解析，可以反复重做直到掌握。" },
  { icon: Layers, t: "记忆卡片", d: "术语一键变卡片，按遗忘曲线安排每天该复习的内容。" },
  { icon: CalendarRange, t: "学习计划", d: "告诉它考试日期和每天时长，排出可执行的分日计划。" },
  { icon: ShieldCheck, t: "Key 不落库", d: "用你自己的 DeepSeek Key，只存在你的浏览器里。" },
];

const TYPES = [
  { k: "实证研究", q: "X 真的影响了 Y 吗，凭什么说不是巧合？", f: "变量与度量、识别策略、样本、异质性、因果边界" },
  { k: "教材章节", q: "这一节要解决什么，和前后知识怎么接？", f: "核心概念、推导过程、例题思路、易错点" },
  { k: "讲义课件", q: "老师在这几页想讲清什么？", f: "还原讲授逻辑、补全省略的推理、标出推断" },
];

function Landing() {
  const signedIn = useSignedIn();
  const cta = signedIn ? (
    <Button asChild size="xl"><Link to="/read/new">开始精读 <ArrowRight /></Link></Button>
  ) : (
    <Button asChild size="xl"><Link to="/auth">免费开始 <ArrowRight /></Link></Button>
  );

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <a href="#modules" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:inline">功能</a>
          <a href="#how" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:inline">怎么读</a>
          {signedIn ? (
            <Button asChild variant="ink"><Link to="/desk">进入书桌</Link></Button>
          ) : (
            <Button asChild variant="ink"><Link to="/auth">登录</Link></Button>
          )}
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={heroInk}
          alt="水墨画：翻开的书页化作远山与河流，一位书生在松下读书"
          width={1280}
          height={960}
          className="pointer-events-none absolute right-0 top-0 h-full w-full object-cover object-right opacity-90 md:w-[70%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-32 md:pt-24">
          <p className="eyebrow animate-rise">{BRAND.readModule} · {BRAND.readModuleDesc}</p>
          <h1 className="mt-5 max-w-2xl animate-rise text-5xl font-black leading-[1.15] md:text-7xl [animation-delay:80ms]">
            把难读的材料，
            <br />
            读成一堂<span className="relative whitespace-nowrap text-primary">听得懂<span className="absolute -bottom-1 left-0 h-2 w-full bg-ochre-soft -z-10" /></span>的课。
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
            不止总结摘要。知微把研究问题、作用机制、主体关系和证据逐层拆开，用老师讲得明白、你能复述的话讲给你听——再陪你练题、复习，直到真正记住。
          </p>
          <div className="mt-9 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
            {cta}
            <Button asChild size="xl" variant="paper"><a href="#how">看看怎么拆解</a></Button>
          </div>
          <ol className="mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="paper flex items-start gap-3 p-4">
                <span className="seal h-8 w-8 shrink-0 text-sm">{s.n}</span>
                <span>
                  <span className="block font-serif font-semibold">{s.t}</span>
                  <span className="text-xs text-muted-foreground">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="modules" className="border-y bg-paper-deep/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="eyebrow">一张书桌</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">从读懂，到记住。</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div key={m.t} className="paper p-5 transition-shadow hover:shadow-lift">
                <m.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-semibold">{m.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">示例 · 经济学</p>
            <h2 className="mt-3 text-3xl font-bold">数字金融与中小企业融资约束</h2>
            <p className="mt-4 text-muted-foreground">
              一句话：数字工具把“看不见的经营状况”变成可验证的数据，让缺抵押物的中小企业更容易获得贷款。
            </p>
            <div className="mt-8 space-y-3">
              {TYPES.map((t) => (
                <div key={t.k} className="paper p-4">
                  <p className="text-xs font-semibold tracking-widest text-primary">{t.k}</p>
                  <p className="mt-1 font-serif font-semibold">{t.q}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.f}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="paper space-y-6 p-6 md:p-8">
            {[
              {
                h: "先抓住论文真正要回答的问题",
                e: "作者问的是一个可以检验的问题：使用数字金融以后，中小企业融资难的问题是否减轻。把研究问题写成“X 是否影响 Y”，后面的变量和结论就容易对上了。",
                a: "像医生不是问“运动有没有用”，而是问“规律运动能否降低某类人的血压”。",
                q: "数字金融是否以及如何缓解中小企业的融资约束",
              },
              {
                h: "把关联和因果分开",
                e: "两组变化不同，并不自动证明数字金融就是原因。经营更好的企业也可能更愿意用数字工具——要看作者如何处理内生性。",
                a: "带伞的人更容易被淋湿，不代表伞导致下雨。",
                q: "关联不自动等于因果",
              },
            ].map((s, i) => (
              <div key={s.h}>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-black text-primary/30">0{i + 1}</span>
                  <h3 className="text-lg font-semibold">{s.h}</h3>
                </div>
                <p className="prose-read mt-2 text-foreground/85">{s.e}</p>
                <p className="mt-3 rounded-md bg-jade-soft px-3 py-2 text-sm text-jade">换个日常说法：{s.a}</p>
                <p className="evidence mt-3 px-3 py-2 text-sm">原文依据：「{s.q}」</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-xl bg-ink px-8 py-14 text-ink-foreground md:px-14">
          <h2 className="max-w-xl text-3xl font-bold md:text-4xl">读懂，不等于把每句话都翻译一遍。</h2>
          <p className="mt-4 max-w-lg text-ink-foreground/70">真正有效的精读，是先建立结构，再补细节。今天就放一篇进来试试。</p>
          <div className="mt-8">{cta}</div>
          <span className="seal absolute -bottom-6 right-8 h-32 w-32 rotate-6 text-6xl opacity-90">微</span>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        {BRAND.name} · {BRAND.tagline} · 解读内容由 AI 生成，仅供学习参考，请以原文为准
      </footer>
    </div>
  );
}
