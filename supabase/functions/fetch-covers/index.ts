const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (!id || !secret) {
    console.log("naver: missing credentials", { hasId: !!id, hasSecret: !!secret });
    return null;
  }
  try {
    const q = `${title} ${author}`.trim();
    const url = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(q)}&display=3`;
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id.trim(), "X-Naver-Client-Secret": secret.trim() },
    });
    if (!res.ok) {
      console.log("naver: http error", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    console.log("naver: items", items.length, "for", q);
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
    if (!res.ok) {
      console.log("google: http error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    console.log("google: items", items.length, "for", q);
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

// 네이버 이미지 검색 (책 검색 API가 종료되어 대체 사용)
async function searchNaverImage(title: string, author: string): Promise<string | null> {
  const id = Deno.env.get("NAVER_CLIENT_ID");
  const secret = Deno.env.get("NAVER_CLIENT_SECRET");
  if (!id || !secret) return null;
  try {
    const q = `${title} ${author} 책 표지`.trim();
    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(q)}&display=5&filter=all`;
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id.trim(), "X-Naver-Client-Secret": secret.trim() },
    });
    if (!res.ok) {
      console.log("naver image: http error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const json = await res.json();
    const items: any[] = json?.items ?? [];
    console.log("naver image: items", items.length, "for", q);
    // 세로로 긴 이미지(책 표지 비율)를 우선
    const BOOKSTORES = ["aladin.co.kr", "kyobobook", "yes24.com", "interpark", "ridibooks", "bookthumb", "nl.go.kr", "millie"];
    const portrait = items
      .map((it) => ({ it, w: Number(it.sizewidth) || 0, h: Number(it.sizeheight) || 0 }))
      .filter((x) => x.h > x.w * 1.15);
    const fromStore = portrait.find((x) =>
      BOOKSTORES.some((d) => String(x.it.link || "").includes(d))
    );
    const best = fromStore?.it ?? portrait[0]?.it;
    if (!best) return null;
    return best.link || best.thumbnail || null;
  } catch (e) {
    console.error("naver image error", e);
    return null;
  }
}

// 카카오(다음) 책 검색 - 키가 있으면 사용
async function searchKakao(title: string, author: string): Promise<string | null> {
  const key = Deno.env.get("KAKAO_REST_API_KEY");
  if (!key) return null;
  try {
    const q = `${title} ${author}`.trim();
    const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(q)}&size=3`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key.trim()}` } });
    if (!res.ok) {
      console.log("kakao: http error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const json = await res.json();
    const docs: any[] = json?.documents ?? [];
    console.log("kakao: docs", docs.length, "for", q);
    return docs.find((d) => d.thumbnail)?.thumbnail || null;
  } catch (e) {
    console.error("kakao error", e);
    return null;
  }
}

async function findCover(title: string, author: string): Promise<string | null> {
  // 카카오(한국 책 강함) → 네이버 책 → 네이버 이미지 → Google → Open Library
  return (
    (await searchKakao(title, author)) ??
    (await searchKakao(title, "")) ??
    (await searchNaver(title, author)) ??
    (await searchNaverImage(title, author)) ??
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