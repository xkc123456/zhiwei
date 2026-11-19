import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/app/Logo";
import { SocialButtons } from "@/components/app/SocialButtons";
import heroInk from "@/assets/hero-ink.jpg";

const searchSchema = z.object({ redirect: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "登录 · 知微" },
      { name: "description", content: "登录知微，精读记录、错题本和复习卡片会同步到云端。" },
      { property: "og:title", content: "登录 · 知微" },
      { property: "og:description", content: "登录知微，学习记录随时同步。" },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/desk";
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin || u.pathname.startsWith("/auth")) return "/desk";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/desk";
  }
}

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const goNext = () => router.history.push(safePath(redirect));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goNext();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) goNext();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message.includes("Invalid") ? "邮箱或密码不正确" : error.message);
        goNext();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw new Error(error.message);
        if (data.session) goNext();
        else setSent("注册确认邮件已发出，请到邮箱点击链接完成注册。");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw new Error(error.message);
        setSent("重置密码的邮件已发出，请查收。");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "出错了，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroInk} alt="水墨书卷与远山" width={1280} height={960} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-background/80" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />
          <blockquote className="max-w-sm font-serif text-2xl leading-relaxed">
            “见微以知萌，见端以知末。”
            <footer className="mt-3 text-sm text-muted-foreground">—— 《韩非子·说林上》</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold">
            {mode === "signin" ? "欢迎回来" : mode === "signup" ? "创建账号" : "找回密码"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot" ? "输入注册邮箱，我们会发一封重置邮件。" : "登录后，精读存档、错题和复习卡片会同步到云端。"}
          </p>

          {sent ? (
            <div className="evidence mt-8 p-4 text-sm">{sent}</div>
          ) : (
            <>
              {mode !== "forgot" ? (
                <div className="mt-8 space-y-4">
                  <SocialButtons onSignedIn={goNext} />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> 或使用邮箱 <span className="h-px flex-1 bg-border" />
                  </div>
                </div>
              ) : null}
              <form onSubmit={submit} className="mt-4 space-y-4">
                {mode === "signup" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">怎么称呼你</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：小林" />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="例如：123456789@qq.com" />
                  {mode === "signup" ? (
                    <p className="text-xs text-muted-foreground">支持 QQ 邮箱、163 邮箱等常用邮箱。确认邮件如果没收到，请看看垃圾箱。</p>
                  ) : null}
                </div>
                {mode !== "forgot" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">密码</Label>
                      {mode === "signin" ? (
                        <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setMode("forgot")}>
                          忘记密码？
                        </button>
                      ) : null}
                    </div>
                    <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                ) : null}
                <Button type="submit" className="h-10 w-full" disabled={busy}>
                  {busy ? "请稍候…" : mode === "signin" ? "登录" : mode === "signup" ? "注册" : "发送重置邮件"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>还没有账号？<button className="text-primary hover:underline" onClick={() => { setMode("signup"); setSent(null); }}>注册</button></>
            ) : (
              <>已有账号？<button className="text-primary hover:underline" onClick={() => { setMode("signin"); setSent(null); }}>登录</button></>
            )}
          </p>
          <p className="mt-2 text-center text-xs"><Link to="/" className="text-muted-foreground hover:text-foreground">← 返回首页</Link></p>
        </div>
      </div>
    </div>
  );
}
