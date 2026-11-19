import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().max(200_000),
});

const inputSchema = z.object({
  apiKey: z.string().min(10).max(200),
  model: z.enum(["deepseek-chat", "deepseek-reasoner"]),
  messages: z.array(messageSchema).min(1).max(60),
  json: z.boolean(),
  maxTokens: z.number().int().min(256).max(8192).optional(),
});

export type AiResult = { ok: true; content: string } | { ok: false; error: string };

function friendlyError(status: number): string {
  if (status === 401) return "DeepSeek Key 无效，请到设置里检查后重试。";
  if (status === 402) return "DeepSeek 账户余额不足，充值后再试。";
  if (status === 429) return "请求太频繁，稍等片刻再试。";
  if (status === 400 || status === 422) return "这段内容过长或格式有误，试着缩短后再提交。";
  return "模型服务暂时不可用，请稍后再试。";
}

/**
 * Forwards one chat request to DeepSeek using the visitor's own key.
 * The key is used only for this request: never stored, never logged.
 */
export const callDeepSeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiResult> => {
    const body: Record<string, unknown> = {
      model: data.model,
      messages: data.messages,
      stream: false,
      max_tokens: data.maxTokens ?? 8000,
    };
    if (data.json && data.model === "deepseek-chat") {
      body["response_format"] = { type: "json_object" };
    }
    if (data.model === "deepseek-chat") body["temperature"] = 0.4;

    let res: Response;
    try {
      res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "无法连接到 DeepSeek，请检查网络后重试。" };
    }

    if (!res.ok) {
      console.error("DeepSeek request failed with status", res.status);
      return { ok: false, error: friendlyError(res.status) };
    }

    const json = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "模型没有返回内容，请重试。" };
    return { ok: true, content };
  });
