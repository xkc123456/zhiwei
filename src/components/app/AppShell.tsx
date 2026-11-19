import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BookOpenText,
  CalendarRange,
  KeyRound,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  NotebookPen,
  PenLine,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { KeyDialog } from "./KeyDialog";
import { useAiSettings } from "@/lib/ai-settings";
import { cardsQuery, profileQuery } from "@/lib/data";
import { BRAND } from "@/lib/brand";

const NAV = [
  { group: "", items: [{ to: "/desk", label: "书桌", icon: LayoutDashboard }] },
  {
    group: BRAND.readModule,
    items: [
      { to: "/read/new", label: "开始精读", icon: BookOpenText },
      { to: "/library", label: "我的存档", icon: Library },
    ],
  },
  {
    group: "练与复习",
    items: [
      { to: "/practice", label: "练题", icon: PenLine },
      { to: "/mistakes", label: "错题本", icon: NotebookPen },
      { to: "/review", label: "记忆卡片", icon: Layers },
      { to: "/plan", label: "学习计划", icon: CalendarRange },
    ],
  },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { data: cards } = useQuery(cardsQuery());
  const due = (cards ?? []).filter((c) => new Date(c.due_at) <= new Date()).length;
  return (
    <nav className="space-y-6">
      {NAV.map((g) => (
        <div key={g.group || "home"}>
          {g.group ? (
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.25em] text-muted-foreground">{g.group}</p>
          ) : null}
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground font-medium" }}
                >
                  <it.icon className="h-4 w-4" />
                  <span className="flex-1">{it.label}</span>
                  {it.to === "/review" && due > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{due}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const settings = useAiSettings();
  const { data: profile } = useQuery(profileQuery());
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <div className="space-y-3 border-t border-sidebar-border pt-4">
      <KeyDialog
        trigger={
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-sidebar-accent">
            <KeyRound className="h-4 w-4" />
            <span className="flex-1">DeepSeek Key</span>
            <span className={settings.apiKey ? "text-jade" : "text-primary"}>{settings.apiKey ? "已连接" : "未填写"}</span>
          </button>
        }
      />
      <div className="flex items-center gap-2 px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile?.display_name || "同学"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.major || profile?.email}</p>
        </div>
        <Link to="/settings" className="rounded-md p-1.5 hover:bg-sidebar-accent" aria-label="个人设置">
          <Settings className="h-4 w-4" />
        </Link>
        <button
          className="rounded-md p-1.5 hover:bg-sidebar-accent"
          aria-label="退出登录"
          onClick={async () => {
            await qc.cancelQueries();
            qc.clear();
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="space-y-8">
          <Logo to="/desk" className="px-2 pt-1" />
          <NavList />
        </div>
        <SidebarFooter />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo to="/desk" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="打开菜单">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col justify-between bg-sidebar p-4">
              <div className="space-y-8 pt-6">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
              <SidebarFooter />
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
