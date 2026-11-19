import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Analysis } from "@/lib/prompts";

export function Terms({ analysis }: { analysis: Analysis }) {
  return (
    <Accordion type="multiple" className="paper divide-y px-5">
      {analysis.terms.map((t, i) => (
        <AccordionItem key={i} value={String(i)} className="border-0">
          <AccordionTrigger className="font-serif text-base hover:no-underline">{t.term}</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm leading-relaxed">
            <p>{t.definition}</p>
            {t.example ? <p className="text-muted-foreground">例：{t.example}</p> : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
