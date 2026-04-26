import { corsHeaders } from "@supabase/supabase-js/cors";

interface BookInput {
  id: string;
  title: string;
  author: string;
}

interface CoverResult {
  id: string;
  cover_url: string | null;
}

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "");

async function searchNaver(title: string, author: string): Promise<string | null> {
  const id = Deno.env.get("NAVER_CLIENT_ID");
  const secret = Deno.env.get("NAVER_CLIENT_SECRET");
  if (!id || !secret) return null;
  try {
    const q = `${title} ${author}`.trim();
    const url = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(q)}&display=3`;
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    const normTitle = stripHtml(title).toLowerCase().replace(/\s+/g, "");
    const best =
      items.find((it) => stripHtml(it.title).toLowerCase().replace(/\s+/g, "").includes(normTitle)) ??
      items[0];
    return best?.image || null;
  } catch (e) {
    console.error("naver error", e);
    return null;
  }
}

async function searchGoogle(title: string, author: string): Promise<string | null> {
  try {
    const q = `intitle:${title}${author ? `+inauthor:${author}` : ""}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3&printType=books`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    for (const it of items) {
      const links = it?.volumeInfo?.imageLinks;
      const raw = links?.thumbnail || links?.smallThumbnail;
      if (raw) return raw.replace(/^http:/, "https:").replace("&edge=curl", "");
    }
    return null;
  } catch (e) {
    console.error("google error", e);
    return null;
  }
}

async function searchOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ title, author, limit: "1" });
    const res = await fetch(`https://openlibrary.org/search.json?${q.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    const doc = json?.docs?.[0];
    if (doc?.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    if (doc?.isbn?.[0]) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
    return null;
  } catch {
    return null;
  }
}

async function findCover(title: string, author: string): Promise<string | null> {
  // 네이버(한국 책 강함) → Google → Open Library
  return (
    (await searchNaver(title, author)) ??
    (await searchGoogle(title, author)) ??
    (await searchGoogle(title, "")) ??
    (await searchOpenLibrary(title, author))
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const books: BookInput[] = Array.isArray(body?.books) ? body.books : [];
    if (books.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (books.length > 100) {
      return new Response(JSON.stringify({ error: "too many books (max 100)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8개씩 병렬 처리
    const results: CoverResult[] = [];
    const chunkSize = 8;
    for (let i = 0; i < books.length; i += chunkSize) {
      const chunk = books.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (b) => {
          const cover_url = await findCover(b.title || "", b.author || "");
          return { id: b.id, cover_url };
        })
      );
      results.push(...chunkResults);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-covers error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});