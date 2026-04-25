import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  note: string;
}

export const loadBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("id,title,author,date,note")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadBooks error", error);
    return [];
  }
  return (data ?? []) as Book[];
};

export const addBook = async (book: Omit<Book, "id" | "note">): Promise<Book | null> => {
  const { data, error } = await supabase
    .from("books")
    .insert({ ...book, note: "" })
    .select("id,title,author,date,note")
    .single();
  if (error) {
    console.error("addBook error", error);
    return null;
  }
  return data as Book;
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
