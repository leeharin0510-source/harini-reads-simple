import { useEffect, useState } from "react";
import { BookOpen, Plus, ChevronRight, Trash2, Loader2, Pencil } from "lucide-react";
import { Book, addBook, deleteBook, updateBook } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  books: Book[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onChange: () => void | Promise<void>;
}

export const BookList = ({ books, loading, onSelect, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (editing) {
      setEditTitle(editing.title);
      setEditAuthor(editing.author);
      setEditDate(editing.date);
    }
  }, [editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || submitting) return;
    setSubmitting(true);
    await addBook({ title, author, date });
    setTitle(""); setAuthor("");
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
    await updateBook(editing.id, { title: editTitle, author: editAuthor, date: editDate });
    setSavingEdit(false);
    setEditing(null);
    await onChange();
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            <span>{year} Reading</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">하린이의 독서기록</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            올해 읽은 책 {books.length}권
          </p>
        </header>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md px-3 py-2.5 mb-2">
              <Plus className="w-4 h-4" />
              <span>새 책 추가하기</span>
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>새 책 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3 pt-2">
              <Input placeholder="책 제목" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-lg" />
              <Input placeholder="저자" value={author} onChange={(e) => setAuthor(e.target.value)} className="h-11 rounded-lg" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-lg" />
              <Button type="submit" disabled={submitting} className="w-full h-11 rounded-lg">
                {submitting ? "추가 중…" : "추가"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="border-t border-border">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">아직 기록된 책이 없어요</p>
          ) : (
            books.map((book) => (
              <button
                key={book.id}
                onClick={() => onSelect(book.id)}
                className="group w-full flex items-center gap-3 py-4 px-3 -mx-3 border-b border-border hover:bg-accent/50 transition-colors text-left rounded-md"
              >
                <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{book.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {book.author} · {formatDate(book.date)}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, book.id)}
                  className="opacity-0 group-hover:opacity-100 sm:p-2 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${y}.${m}.${day}`;
};
