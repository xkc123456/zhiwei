import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {desc ? <p className="mt-2 max-w-2xl text-muted-foreground">{desc}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
