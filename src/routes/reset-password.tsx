import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/app/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "重置密码 · 知微" },
      { name: "description", content: "为你的知微账号设置新密码。" },
      { property: "og:title", content: "重置密码 · 知微" },
      { property: "og:description", content: "为你的知微账号设置新密码。" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        className="paper w-full max-w-sm space-y-5 p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password });
          setBusy(false);
          if (error) {
            toast.error("链接可能已过期，请重新申请重置邮件。");
            return;
          }
          toast.success("密码已更新");
          navigate({ to: "/desk" });
        }}
      >
        <Logo />
        <h1 className="text-2xl font-bold">设置新密码</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">新密码</Label>
          <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>保存新密码</Button>
      </form>
    </div>
  );
}
