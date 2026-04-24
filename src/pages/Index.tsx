import { useEffect, useState } from "react";
import { PasswordGate, isUnlocked } from "@/components/PasswordGate";
import { BookList } from "@/components/BookList";
import { NoteEditor } from "@/components/NoteEditor";
import { Book, loadBooks } from "@/lib/storage";

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await loadBooks();
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "하린이의 독서기록";
    if (isUnlocked()) {
      setUnlocked(true);
      refresh();
    } else {
      setLoading(false);
    }
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => { setUnlocked(true); refresh(); }} />;
  }

  const selected = books.find((b) => b.id === selectedId);
  if (selected) {
    return <NoteEditor book={selected} onBack={() => { setSelectedId(null); refresh(); }} />;
  }

  return <BookList books={books} loading={loading} onSelect={setSelectedId} onChange={refresh} />;
};

export default Index;
