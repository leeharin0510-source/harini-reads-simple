ALTER TABLE public.books ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
UPDATE public.books SET categories = ARRAY[category] WHERE category IS NOT NULL AND category <> '' AND (categories IS NULL OR cardinality(categories) = 0);
ALTER TABLE public.books DROP COLUMN IF EXISTS category;