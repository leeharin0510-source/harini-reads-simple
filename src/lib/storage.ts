import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  note: string;
  categories: string[];
  cover_url?: string | null;
  created_at?: string;
}

// 카테고리는 이제 클라우드 DB(categories 테이블)에 저장됩니다.
export const loadCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("name,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("loadCategories error", error);
    return [];
  }
  return (data ?? []).map((c: any) => c.name as string);
};

export const addCategory = async (name: string) => {
  const { error } = await supabase.from("categories").insert({ name, sort_order: 100 });
  if (error) console.error("addCategory error", error);
};

export const removeCategory = async (name: string) => {
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) console.error("removeCategory error", error);
};

export const loadBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("id,title,author,date,note,categories,cover_url,created_at")
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
    .select("id,title,author,date,note,categories,cover_url,created_at")
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

// 표지 이미지 직접 업로드 (book-covers 버킷)
export const uploadCoverImage = async (file: File): Promise<string | null> => {
  return uploadImageToBucket(file);
};

// 독서록 본문에 들어갈 이미지 업로드 (같은 book-covers 버킷 재사용)
export const uploadNoteImage = async (file: File): Promise<string | null> => {
  return uploadImageToBucket(file, "notes");
};

const uploadImageToBucket = async (file: File, prefix?: string): Promise<string | null> => {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const name = `${crypto.randomUUID()}.${ext}`;
    const path = prefix ? `${prefix}/${name}` : name;
    const { error } = await supabase.storage
      .from("book-covers")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("upload image error", error);
      return null;
    }
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("upload image error", e);
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
