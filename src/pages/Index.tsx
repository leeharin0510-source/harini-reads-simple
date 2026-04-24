import { useEffect, useState } from "react";
import { BookOpen, BarChart3 } from "lucide-react";
import { PasswordGate, isUnlocked } from "@/components/PasswordGate";
import { BookList } from "@/components/BookList";
import { NoteEditor } from "@/components/NoteEditor";
import { Dashboard } from "@/components/Dashboard";
import { Book, loadBooks } from "@/lib/storage";

type Tab = "list" | "dashboard";

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("list");

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

  return (
    <div className="relative">
      {tab === "list" ? (
        <BookList books={books} loading={loading} onSelect={setSelectedId} onChange={refresh} />
      ) : (
        <Dashboard books={books} />
      )}

      {/* 하단 탭바 */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="doodle-card flex items-center gap-1 p-1.5 bg-card">
          <TabButton
            active={tab === "list"}
            onClick={() => setTab("list")}
            icon={<BookOpen className="w-4 h-4" strokeWidth={2} />}
            label="기록"
          />
          <TabButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
            label="대시보드"
          />
        </div>
      </nav>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all font-doodle ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`}
  >
    {icon}
    <span className="text-base">{label}</span>
  </button>
);

export default Index;
