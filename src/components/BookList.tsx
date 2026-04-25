import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Pencil, X } from "lucide-react";
import { Book, addBook, deleteBook, updateBook, loadCategories, saveCategories } from "@/lib/storage";
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
  const [categories, setCategories] = useState<string[]>(() => loadCategories());
  const [filter, setFilter] = useState<string>("");
  const [manageOpen, setManageOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    if (editing) {
      setEditTitle(editing.title);
      setEditAuthor(editing.author);
      setEditDate(editing.date);
      setEditCats(editing.categories ?? []);
    }
  }, [editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || submitting) return;
    setSubmitting(true);
    await addBook({ title, author, date, categories: selectedCats });
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
    await updateBook(editing.id, { title: editTitle, author: editAuthor, date: editDate, categories: editCats });
    setSavingEdit(false);
    setEditing(null);
    await onChange();
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
              <CategorySelect categories={categories} value={category} onChange={setCategory} />
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
                  className="group doodle-card w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-accent/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={doodle} alt="" aria-hidden className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-handwrite text-lg sm:text-xl text-foreground truncate leading-tight">{book.title}</h3>
                    <p className="font-doodle text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {book.author} · {formatDate(book.date)}
                    </p>
                    {book.category && (
                      <span className="inline-block mt-1 font-doodle text-[11px] px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                        {book.category}
                      </span>
                    )}
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleEdit(e, book)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEdit(e as any, book); }}
                    className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary-soft transition-colors"
                    aria-label="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(e, book.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDelete(e as any, book.id); }}
                    className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-pink-soft transition-colors"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
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
            <Input placeholder="책 제목" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <Input placeholder="저자" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-12 rounded-2xl border-2 font-doodle text-base" />
            <CategorySelect categories={categories} value={editCategory} onChange={setEditCategory} />
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

const CategorySelect = ({ categories, value, onChange }: { categories: string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <p className="font-doodle text-sm text-muted-foreground mb-1.5 px-1">카테고리</p>
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`font-doodle text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${
          value === ""
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:border-primary"
        }`}
      >
        없음
      </button>
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`font-doodle text-xs px-3 py-1.5 rounded-full border-2 transition-colors ${
            value === c
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  </div>
);

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${y}.${m}.${day}`;
};
