import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Analysis } from "@/lib/prompts";

export function Comparison({ analysis }: { analysis: Analysis }) {
  const c = analysis.comparison;
  if (!c || !c.columns.length) return <p className="text-sm text-muted-foreground">这份材料没有适合分栏对比的内容。</p>;
  return (
    <div className="paper overflow-x-auto p-2">
      {c.title ? <p className="px-3 pt-2 font-serif font-semibold">{c.title}</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            {c.columns.map((h, i) => <TableHead key={i} className="font-semibold text-foreground">{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {c.rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((cell, k) => <TableCell key={k} className={k === 0 ? "font-medium" : ""}>{cell}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
