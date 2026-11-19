import { Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: "/" | "/desk" }) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="seal h-9 w-9 text-lg transition-transform group-hover:-rotate-6">微</span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-xl font-bold tracking-wider text-foreground">{BRAND.name}</span>
        <span className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground">知微见著</span>
      </span>
    </Link>
  );
}
