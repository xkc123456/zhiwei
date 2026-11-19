import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/app/PageHeader";
import { KeyForm } from "@/components/app/KeyDialog";
import { profileQuery } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "设置 · 知微" },
      { name: "description", content: "个人资料与 DeepSeek Key 设置。" },
      { property: "og:title", content: "设置 · 知微" },
      { property: "og:description", content: "个人资料与 Key 设置。" },
    ],
  }),
  component: SettingsPage,
});

const DEGREES = ["专科", "本科", "硕士研究生", "博士研究生及以上"];

function SettingsPage() {
  const { data: profile } = useQuery(profileQuery());
  const qc = useQueryClient();
  const [form, setForm] = useState({ display_name: "", school: "", major: "", degree: "" });
  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name ?? "", school: profile.school ?? "", major: profile.major ?? "", degree: profile.degree ?? "" });
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("profiles").upsert({ id: profile.id, ...form });
    if (error) {
      toast.error("保存失败");
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("已保存，之后的讲解会贴合你的专业");
  }

  return (
    <div className="animate-rise">
      <PageHeader title="设置" desc="填写院校和专业，讲解、出题和计划会更贴合你的背景。" />
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={save} className="paper space-y-4 p-6">
          <h2 className="text-lg font-semibold">个人资料</h2>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
          <div className="space-y-1.5">
            <Label htmlFor="dn">称呼</Label>
            <Input id="dn" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school">学校</Label>
            <Input id="school" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="例如：南京大学" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="major">专业</Label>
              <Input id="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="例如：金融学" />
            </div>
            <div className="space-y-1.5">
              <Label>学历层次</Label>
              <Select value={form.degree} onValueChange={(v) => setForm({ ...form, degree: v })}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>{DEGREES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit">保存资料</Button>
        </form>
        <div className="paper space-y-4 p-6">
          <h2 className="text-lg font-semibold">DeepSeek 连接</h2>
          <KeyForm />
        </div>
      </div>
    </div>
  );
}
