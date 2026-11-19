import { useSyncExternalStore } from "react";

export type AiModel = "deepseek-chat" | "deepseek-reasoner";
export type AiSettings = { apiKey: string; model: AiModel };

const STORAGE_KEY = "zhiwei.ai-settings";
const EMPTY: AiSettings = { apiKey: "", model: "deepseek-chat" };
const listeners = new Set<() => void>();
let cache: AiSettings | null = null;

function read(): AiSettings {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<AiSettings>) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function saveAiSettings(next: AiSettings) {
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function clearAiSettings() {
  cache = EMPTY;
  window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((l) => l());
}

/** Key lives only in this browser's localStorage. */
export function useAiSettings(): AiSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}
