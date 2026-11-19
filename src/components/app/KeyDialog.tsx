import { useEffect, useState, type ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { clearAiSettings, saveAiSettings, useAiSettings, type AiModel } from "@/lib/ai-settings";

export function KeyForm({ onSaved }: { onSaved?: () => void }) {
  const settings = useAiSettings();
  const [key, setKey] = useState(settings.apiKey);
  const [model, setModel] = useState<AiModel>(settings.model);
  useEffect(() => {
    setKey(settings.apiKey);
    setModel(settings.model);
  }, [settings.apiKey, settings.model]);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!key.trim().startsWith("sk-")) {
          toast.error("DeepSeek Key 一般以 sk- 开头，请检查一下。");
          return;
        }
        saveAiSettings({ apiKey: key.trim(), model });
        toast.success("已保存在这台设备的浏览器里");
        onSaved?.();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="ds-key">DeepSeek API Key</Label>
        <Input
          id="ds-key"
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          还没有？
          <a className="text-primary underline-offset-4 hover:underline" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">
            去 DeepSeek 开放平台获取
          </a>
        </p>
      </div>
      <div className="space-y-2">
        <Label>模型</Label>
        <RadioGroup value={model} onValueChange={(v) => setModel(v as AiModel)} className="grid gap-2 sm:grid-cols-2">
          {[
            { v: "deepseek-chat", t: "DeepSeek-V3", d: "速度快，适合日常精读" },
            { v: "deepseek-reasoner", t: "DeepSeek-R1", d: "推理更深，耗时更长" },
          ].map((o) => (
            <Label key={o.v} htmlFor={o.v} className="paper flex cursor-pointer items-start gap-3 p-3 font-normal">
              <RadioGroupItem id={o.v} value={o.v} className="mt-0.5" />
              <span>
                <span className="block font-medium">{o.t}</span>
                <span className="text-xs text-muted-foreground">{o.d}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div className="flex items-start gap-2 rounded-md bg-jade-soft p-3 text-xs leading-relaxed text-jade">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Key 只保存在你这台设备的浏览器里，解析时随请求转发给 DeepSeek，不写入数据库、不进日志。费用由你的 DeepSeek 账户承担。
      </div>
      <div className="flex justify-between gap-2">
        {settings.apiKey ? (
          <Button type="button" variant="ghost" onClick={() => { clearAiSettings(); toast("已从这台设备移除 Key"); }}>
            移除 Key
          </Button>
        ) : <span />}
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}

export function KeyDialog({ trigger, open, onOpenChange }: { trigger?: ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [inner, setInner] = useState(false);
  const isOpen = open ?? inner;
  const setOpen = onOpenChange ?? setInner;
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <KeyRound className="h-5 w-5 text-primary" /> 连接你的 DeepSeek
          </DialogTitle>
          <DialogDescription>知微不替你承担模型费用，解析使用你自己的 Key。</DialogDescription>
        </DialogHeader>
        <KeyForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
