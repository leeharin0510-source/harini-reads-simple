import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  note: string;
  categories: string[];
  cover_url?: string | null;
}

const DEFAULT_CATEGORIES = [
  "자기계발",
  "경제/금융/부동산",
  "심리",
  "문학",
  "IT",
  "인문학",
];
const CATEGORIES_KEY = "harin_categories";

export const loadCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) return arr;
    }
  } catch {}
  return DEFAULT_CATEGORIES;
};

export const saveCategories = (cats: string[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
};

export const loadBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("id,title,author,date,note,categories,cover_url")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadBooks error", error);
    return [];
  }
  return (data ?? []).map((b: any) => ({ ...b, categories: b.categories ?? [] })) as Book[];
};

export const addBook = async (book: Omit<Book, "id" | "note">): Promise<Book | null> => {
  const { data, error } = await supabase
    .from("books")
    .insert({ ...book, note: "" })
    .select("id,title,author,date,note,categories,cover_url")
    .single();
  if (error) {
    console.error("addBook error", error);
    return null;
  }
  return { ...(data as any), categories: (data as any).categories ?? [] } as Book;
};

// 책 표지 자동 검색: 에지 함수 호출 (네이버 → Google → Open Library 순)
export const fetchCoverUrl = async (title: string, author: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-covers", {
      body: { books: [{ id: "_", title, author }] },
    });
    if (error) {
      console.error("fetchCoverUrl invoke error", error);
      return null;
    }
    return data?.results?.[0]?.cover_url ?? null;
  } catch (e) {
    console.error("fetchCoverUrl error", e);
    return null;
  }
};

// 표지가 비어있는 책들 일괄 자동 검색 (서버에서 병렬 처리)
export const backfillCovers = async (books: Book[]): Promise<number> => {
  const targets = books.filter((b) => !b.cover_url);
  if (targets.length === 0) return 0;

  // 50권씩 배치로 호출 (서버 한 번 호출에 너무 많이 보내지 않도록)
  let found = 0;
  const batchSize = 50;
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const { data, error } = await supabase.functions.invoke("fetch-covers", {
      body: { books: batch.map((b) => ({ id: b.id, title: b.title, author: b.author })) },
    });
    if (error) {
      console.error("backfillCovers invoke error", error);
      continue;
    }
    const results: { id: string; cover_url: string | null }[] = data?.results ?? [];
    // DB에 병렬로 업데이트
    await Promise.all(
      results
        .filter((r) => r.cover_url)
        .map(async (r) => {
          await updateBook(r.id, { cover_url: r.cover_url });
          found++;
        })
    );
  }
  return found;
};

export const updateBook = async (id: string, patch: Partial<Book>) => {
  const { error } = await supabase
    .from("books")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("updateBook error", error);
};

export const deleteBook = async (id: string) => {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) console.error("deleteBook error", error);
};
