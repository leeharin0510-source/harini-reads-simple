CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categories" ON public.categories FOR DELETE USING (true);

INSERT INTO public.categories (name, sort_order)
SELECT n, i FROM unnest(ARRAY['자기계발','경제/금융/부동산','심리','문학','IT','인문학']) WITH ORDINALITY AS t(n, i)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, sort_order)
SELECT DISTINCT c, 100 FROM public.books, unnest(categories) AS c
WHERE c <> ''
ON CONFLICT (name) DO NOTHING;