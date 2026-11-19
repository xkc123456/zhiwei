import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analysisSchema, type Analysis, type DocKind } from "@/lib/prompts";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type DocRow = {
  id: string;
  kind: DocKind;
  title: string;
  discipline: string | null;
  source_text: string;
  analysis: Analysis;
  chat: ChatMsg[];
  created_at: string;
  updated_at: string;
};

function toDoc(row: Record<string, unknown>): DocRow {
  return {
    ...(row as unknown as DocRow),
    analysis: analysisSchema.parse(row["analysis"] ?? {}),
    chat: Array.isArray(row["chat"]) ? (row["chat"] as ChatMsg[]) : [],
  };
}

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (error) throw error;
      return { email: u.user.email ?? "", id: u.user.id, ...(data ?? {}) } as {
        id: string;
        email: string;
        display_name?: string | null;
        school?: string | null;
        major?: string | null;
        degree?: string | null;
      };
    },
  });

export const documentsQuery = () =>
  queryOptions({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, kind, title, discipline, created_at, updated_at, analysis")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => {
        const a = analysisSchema.parse(r.analysis ?? {});
        return {
          id: r.id,
          kind: r.kind as DocKind,
          title: r.title,
          discipline: r.discipline,
          updated_at: r.updated_at,
          oneLiner: a.oneLiner,
          difficulty: a.difficulty,
          minutes: a.minutes,
        };
      });
    },
  });

export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toDoc(data as unknown as Record<string, unknown>) : null;
    },
  });

export type MistakeRow = {
  id: string;
  document_id: string | null;
  source_title: string | null;
  question: string;
  options: string[];
  answer_index: number;
  user_index: number | null;
  explanation: string | null;
  mastered: boolean;
  attempts: number;
  created_at: string;
};

export const mistakesQuery = () =>
  queryOptions({
    queryKey: ["mistakes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mistakes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => ({ ...m, options: (m.options as string[]) ?? [] })) as MistakeRow[];
    },
  });

export type CardRow = {
  id: string;
  document_id: string | null;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
};

export const cardsQuery = () =>
  queryOptions({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("review_cards").select("*").order("due_at");
      if (error) throw error;
      return (data ?? []) as CardRow[];
    },
  });

export const plansQuery = () =>
  queryOptions({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_plans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Records wrong answers in the mistake notebook. */
export async function saveMistakes(
  items: { question: string; options: string[]; answerIndex: number; userIndex: number; explanation: string }[],
  source: { documentId?: string | null | undefined; title?: string | null | undefined },
) {
  if (!items.length) return;
  const { error } = await supabase.from("mistakes").insert(
    items.map((q) => ({
      document_id: source.documentId ?? null,
      source_title: source.title ?? null,
      question: q.question,
      options: q.options,
      answer_index: q.answerIndex,
      user_index: q.userIndex,
      explanation: q.explanation,
    })),
  );
  if (error) throw error;
}
