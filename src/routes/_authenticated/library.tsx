import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/PageHeader";
import { documentsQuery } from "@/lib/data";
import { KIND_LABEL, type DocKind } from "@/lib/prompts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "我的存档 · 澄读 · 知微" },
      { name: "description", content: "所有精读过的论文、教材和课件。" },
      { property: "og:title", content: "我的存档 · 澄读 · 知微" },
      { property: "og:description", content: "所有精读过的材料。" },
    ],
  }),
  component: Library,
});

function Library() {
  const { data: docs = [], isLoading } = useQuery(documentsQuery());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<DocKind | "all">("all");
  const list = useMemo(
    () => docs.filter((d) => (kind === "all" || d.kind === kind) && (d.title + (d.discipline ?? "") + d.oneLiner).includes(q)),
    [docs, q, kind],
  );
  const disciplines = Array.from(new Set(docs.map((d) => d.discipline).filter(Boolean)));

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="澄读" title="我的存档" desc={`共 ${docs.length} 份精读${disciplines.length ? `，涉及 ${disciplines.length} 个学科` : ""}。`}
        actions={<Button asChild><Link to="/read/new"><Plus /> 新的精读</Link></Button>} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题、学科或要点" className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["all", "paper", "textbook", "slides"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-3 py-1.5 text-sm", kind === k ? "border-ink bg-ink text-ink-foreground" : "bg-card")}>
              {k === "all" ? "全部" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">加载中…</p> : list.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <Link key={d.id} to="/read/$id" params={{ id: d.id }} className="paper flex flex-col p-5 hover:shadow-lift">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-accent px-2 py-0.5 text-accent-foreground">{KIND_LABEL[d.kind]}</span>
                {d.discipline ? <span className="text-muted-foreground">{d.discipline}</span> : null}
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold">{d.title}</h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{d.oneLiner}</p>
              <p className="mt-4 text-xs text-muted-foreground">{new Date(d.updated_at).toLocaleDateString("zh-CN")} · {d.difficulty} · {d.minutes} 分钟</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="paper p-10 text-center text-muted-foreground">{docs.length ? "没有符合条件的存档。" : "还没有存档，去放进第一份材料吧。"}</div>
      )}
    </div>
  );
}
