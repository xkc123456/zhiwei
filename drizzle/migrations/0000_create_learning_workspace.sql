CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  school text,
  major text,
  degree text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'paper',
  title text NOT NULL DEFAULT '未命名',
  discipline text,
  source_text text NOT NULL DEFAULT '',
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER documents_touch BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX documents_user_idx ON public.documents (user_id, updated_at DESC);

CREATE TABLE public.mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  source_title text,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_index int NOT NULL,
  user_index int,
  explanation text,
  mastered boolean NOT NULL DEFAULT false,
  attempts int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mistakes" ON public.mistakes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX mistakes_user_idx ON public.mistakes (user_id, created_at DESC);

CREATE TABLE public.review_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  ease real NOT NULL DEFAULT 2.5,
  interval_days int NOT NULL DEFAULT 0,
  repetitions int NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_cards TO authenticated;
GRANT ALL ON public.review_cards TO service_role;
ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.review_cards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX review_cards_due_idx ON public.review_cards (user_id, due_at);

CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  goal text NOT NULL,
  exam_date date,
  hours_per_day numeric,
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  done jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);