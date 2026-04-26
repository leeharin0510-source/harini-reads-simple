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

// 책 표지 자동 검색: Open Library Search API 사용 (무료, 키 불필요)
export const fetchCoverUrl = async (title: string, author: string): Promise<string | null> => {
  try {
    const q = new URLSearchParams({ title, author, limit: "1" });
    const res = await fetch(`https://openlibrary.org/search.json?${q.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    const doc = json?.docs?.[0];
    const coverId = doc?.cover_i;
    if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    const isbn = doc?.isbn?.[0];
    if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    return null;
  } catch (e) {
    console.error("fetchCoverUrl error", e);
    return null;
  }
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
