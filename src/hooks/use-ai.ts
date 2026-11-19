import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import type { z } from "zod";
import { callDeepSeek } from "@/lib/ai.functions";
import { extractJson } from "@/lib/prompts";
import { useAiSettings } from "@/lib/ai-settings";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export class MissingKeyError extends Error {
  constructor() {
    super("请先在设置里填写你的 DeepSeek Key。");
  }
}

export function useAi() {
  const settings = useAiSettings();
  const call = useServerFn(callDeepSeek);

  const text = useCallback(
    async (messages: Msg[], maxTokens?: number | undefined) => {
      if (!settings.apiKey) throw new MissingKeyError();
      const res = await call({
        data: { apiKey: settings.apiKey, model: settings.model, messages, json: false, ...(maxTokens ? { maxTokens } : {}) },
      });
      if (!res.ok) throw new Error(res.error);
      return res.content;
    },
    [call, settings],
  );

  const json = useCallback(
    async <S extends z.ZodType>(messages: Msg[], schema: S): Promise<z.output<S>> => {
      if (!settings.apiKey) throw new MissingKeyError();
      const res = await call({
        data: { apiKey: settings.apiKey, model: settings.model, messages, json: true },
      });
      if (!res.ok) throw new Error(res.error);
      return schema.parse(extractJson(res.content));
    },
    [call, settings],
  );

  return { hasKey: Boolean(settings.apiKey), model: settings.model, text, json };
}
