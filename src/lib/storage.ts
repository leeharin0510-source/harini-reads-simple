import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  note: string;
  categories: string[];
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
    .select("id,title,author,date,note,categories")
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
    .select("id,title,author,date,note,categories")
    .single();
  if (error) {
    console.error("addBook error", error);
    return null;
  }
  return { ...(data as any), categories: (data as any).categories ?? [] } as Book;
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
