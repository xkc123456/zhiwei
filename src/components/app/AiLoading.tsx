export function AiLoading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="paper flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 animate-ink rounded-full bg-ink/15" />
        <span className="absolute inset-3 animate-ink rounded-full bg-primary/60 [animation-delay:0.3s]" />
      </div>
      <p className="font-serif text-lg">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
