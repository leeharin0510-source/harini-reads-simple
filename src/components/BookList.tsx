import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Loader2, Pencil, X, Upload } from "lucide-react";
import { Book, addBook, deleteBook, updateBook, loadCategories, saveCategories, fetchCoverUrl, backfillCovers, uploadCoverImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import sproutImg from "@/assets/doodle-sprout.png";
import cloudImg from "@/assets/doodle-cloud.png";
import sunImg from "@/assets/doodle-sun.png";
import flowerImg from "@/assets/doodle-flower.png";
import bookImg from "@/assets/doodle-book.png";
import heartImg from "@/assets/doodle-heart.png";
import sparkleImg from "@/assets/doodle-sparkle.png";

interface Props {
  books: Book[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onChange: () => void | Promise<void>;
}

const ROW_DOODLES = [flowerImg, sproutImg, heartImg, sparkleImg, cloudImg];

export const BookList = ({ books, loading, onSelect, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCats, setEditCats] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [filter, setFilter] = useState<string>("");
  const [manageOpen, setManageOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    if (editing) {
      setEditTitle(editing.title);
      setEditAuthor(editing.author);
      setEditDate(editing.date);
      setEditCats(editing.categories ?? []);
      setEditCover(editing.cover_url ?? null);
    }
  }, [editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || submitting) return;
    setSubmitting(true);
    const cover_url = await fetchCoverUrl(title, author);
    await addBook({ title, author, date, categories: selectedCats, cover_url });
    setTitle(""); setAuthor(""); setSelectedCats([]);
    setOpen(false);
    setSubmitting(false);
    await onChange();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("삭제하시겠어요?")) {
      await deleteBook(id);
      await onChange();
    }
  };

  const handleEdit = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    setEditing(book);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editTitle.trim() || !editAuthor.trim() || savingEdit) return;
    setSavingEdit(true);
    const patch: Partial<Book> = { title: editTitle, author: editAuthor, date: editDate, categories: editCats };
    // 사용자가 수동으로 변경한 표지가 있으면 우선 사용
    if (editCover !== (editing.cover_url ?? null)) {
      patch.cover_url = editCover;
    } else {
      const titleChanged = editTitle !== editing.title || editAuthor !== editing.author;
      if (titleChanged || !editing.cover_url) {
        const cover_url = await fetchCoverUrl(editTitle, editAuthor);
        if (cover_url) patch.cover_url = cover_url;
      }
    }
    await updateBook(editing.id, patch);
    setSavingEdit(false);
    setEditing(null);
    await onChange();
  };

  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지는 5MB 이하여야 해요");
      return;
    }
    setUploadingCover(true);
    const url = await uploadCoverImage(file);
    setUploadingCover(false);
    if (url) setEditCover(url);
    else alert("업로드에 실패했어요");
  };

  const addCategory = () => {
    const v = newCat.trim();
    if (!v || categories.includes(v)) { setNewCat(""); return; }
    const next = [...categories, v];
    setCategories(next);
    saveCategories(next);
    setNewCat("");
  };

  const removeCategory = (c: string) => {
    const next = categories.filter((x) => x !== c);
    setCategories(next);
    saveCategories(next);
    if (filter === c) setFilter("");
  };

  const filteredBooks = filter ? books.filter((b) => (b.categories ?? []).includes(filter)) : books;

  const missingCovers = books.filter((b) => !b.cover_url).length;

  const runBackfill = async () => {
    if (backfilling || missingCovers === 0) return;
    setBackfilling(true);
    const found = await backfillCovers(books);
    setBackfilling(false);
    alert(`표지 ${found}개를 찾았어요 (총 ${missingCovers}권 중)`);
    await onChange();
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-10 pb-28">
        {/* 헤더 with doodles */}
        <header className="relative mb-8">
          <img src={sunImg} alt="" aria-hidden className="absolute -top-4 -right-2 w-20 h-20 animate-wiggle" />
          <img src={cloudImg} alt="" aria-hidden className="absolute top-6 right-20 w-16 h-12 opacity-80 animate-float" />
          <div className="relative">
            <p className="font-handwrite text-xl text-primary mb-1">{year} ✿ Reading Diary</p>
            <h1 className="font-handwrite text-5xl sm:text-6xl text-foreground leading-none">
              하린이의<br/>독서기록
            </h1>
            <div className="flex items-center gap-2 mt-4">
              <img src={sproutImg} alt="" aria-hidden className="w-8 h-8" />
              <p className="font-doodle text-lg text-muted-foreground">
                올해 읽은 책 <span className="text-primary font-bold">{books.length}</span>권
              </p>
            </div>
          </div>
        </header>

        {/* 카테고리 필터 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CatChip active={filter === ""} onClick={() => setFilter("")}>전체</CatChip>
          {categories.map((c) => (
            <CatChip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</CatChip>
          ))}
          <button
            onClick={() => setManageOpen(true)}
            className="font-doodle text-xs px-3 py-1.5 rounded-full border-2 border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            + 카테고리 관리
          </button>
          {missingCovers > 0 && (
            <button
              onClick={runBackfill}
              disabled={backfilling}
              className="font-doodle text-xs px-3 py-1.5 rounded-full border-2 border-dashed border-primary text-primary hover:bg-primary-soft transition-colors disabled:opacity-50"
            >
              {backfilling ? "찾는 중…" : `📚 표지 자동 채우기 (${missingCovers})`}
            </button>
          )}
        </div>

        {/* 새 책 추가 버튼 */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full doodle-border bg-card hover:bg-accent/50 transition-colors px-4 py-3.5 mb-5 flex items-center justify-center gap-2 font-doodle text-base text-foreground">
              <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />
              <span>새 책 추가하기</span>
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-sm border-2">
            <DialogHeader>
              <DialogTitle className="font-handwrite text-3xl">📖 새 책 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 pt-2">
              <Input placeholder="책 제목" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
              <Input placeholder="저자" value={author} onChange={(e) => setAuthor(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
              <CategoryMultiSelect categories={categories} value={selectedCats} onChange={setSelectedCats} />
              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-2xl font-doodle text-lg">
                {submitting ? "추가 중…" : "추가하기 ✿"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* 책 리스트 */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="font-doodle text-sm text-muted-foreground">불러오는 중…</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <img src={bookImg} alt="" aria-hidden className="w-32 h-32 mx-auto mb-3 opacity-80" />
              <p className="font-handwrite text-2xl text-muted-foreground">{filter ? "이 카테고리에 책이 없어요" : "아직 기록된 책이 없어요"}</p>
              <p className="font-doodle text-sm text-muted-foreground mt-1">{filter ? "다른 카테고리를 선택해보세요" : "첫 책을 추가해보세요!"}</p>
            </div>
          ) : (
            filteredBooks.map((book, i) => {
              const doodle = ROW_DOODLES[i % ROW_DOODLES.length];
              return (
                <button
                  key={book.id}
                  onClick={() => onSelect(book.id)}
                  className="group doodle-card w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 text-left"
                >
                  <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-accent/60 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-border">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <img src={doodle} alt="" aria-hidden className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-handwrite text-sm sm:text-lg text-foreground truncate leading-tight">
                      {book.title}
                      {isNew(book.created_at) && (
                        <span className="ml-1.5 align-middle inline-flex items-center font-doodle text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground border border-border">
                          NEW
                        </span>
                      )}
                    </h3>
                    <p className="font-doodle text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                      {book.author} · {formatDate(book.date)}
                    </p>
                    {book.categories && book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.categories.map((c) => (
                          <span key={c} className="font-doodle text-[11px] px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleEdit(e, book)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEdit(e as any, book); }}
                    className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary-soft transition-colors"
                    aria-label="수정"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(e, book.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDelete(e as any, book.id); }}
                    className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-pink-soft transition-colors"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-3xl max-w-sm border-2">
          <DialogHeader>
            <DialogTitle className="font-handwrite text-3xl">✎ 책 정보 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-3 pt-2">
            {/* 표지 업로드 */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-24 rounded-lg border-2 border-border bg-accent/60 overflow-hidden flex items-center justify-center shrink-0">
                {editCover ? (
                  <img src={editCover} alt="표지" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-handwrite text-2xl text-muted-foreground">📖</span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverFile(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="h-9 rounded-xl font-doodle text-sm"
                >
                  {uploadingCover ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />업로드 중…</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1" />표지 직접 올리기</>
                  )}
                </Button>
                {editCover && (
                  <button
                    type="button"
                    onClick={() => setEditCover(null)}
                    className="font-doodle text-xs text-muted-foreground hover:text-destructive text-left"
                  >
                    표지 제거
                  </button>
                )}
              </div>
            </div>
            <Input placeholder="책 제목" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <Input placeholder="저자" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <CategoryMultiSelect categories={categories} value={editCats} onChange={setEditCats} />
            <Button type="submit" disabled={savingEdit} className="w-full h-12 rounded-2xl font-doodle text-lg">
              {savingEdit ? "저장 중…" : "저장하기"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 카테고리 관리 */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-2">
          <DialogHeader>
            <DialogTitle className="font-handwrite text-3xl">🏷️ 카테고리 관리</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 font-doodle text-sm px-3 py-1.5 rounded-full bg-accent text-accent-foreground border-2 border-border">
                  {c}
                  <button onClick={() => removeCategory(c)} aria-label="삭제" className="hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <p className="font-doodle text-sm text-muted-foreground">카테고리가 없어요. 새로 추가해보세요!</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="새 카테고리 이름"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                className="h-11 rounded-2xl border-2 font-doodle text-base"
              />
              <Button type="button" onClick={addCategory} className="h-11 rounded-2xl font-doodle px-5">
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CatChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`font-doodle text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
    }`}
  >
    {children}
  </button>
);

const CategoryMultiSelect = ({ categories, value, onChange }: { categories: string[]; value: string[]; onChange: (v: string[]) => void }) => {
  const toggle = (c: string) => {
    if (value.includes(c)) onChange(value.filter((x) => x !== c));
    else onChange([...value, c]);
  };
  return (
    <div>
      <p className="font-doodle text-sm text-muted-foreground mb-1.5 px-1">카테고리 (중복 선택 가능)</p>
      <div className="flex flex-wrap gap-1.5">
        {categories.length === 0 && (
          <p className="font-doodle text-xs text-muted-foreground">카테고리를 먼저 추가해주세요</p>
        )}
        {categories.map((c) => {
          const active = value.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={`font-doodle text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${y}.${m}.${day}`;
};
