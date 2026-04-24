import { useEffect, useState } from "react";
import { Target, BookOpen, TrendingUp, Pencil, Check } from "lucide-react";
import { Book } from "@/lib/storage";
import { Input } from "@/components/ui/input";

interface Props {
  books: Book[];
}

const GOAL_KEY = "harin_yearly_goal";
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export const Dashboard = ({ books }: Props) => {
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [goal, setGoal] = useState(12);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("12");

  useEffect(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n > 0) {
        setGoal(n);
        setDraft(String(n));
      }
    }
  }, []);

  const thisYearBooks = books.filter((b) => b.date.startsWith(String(year)));
  const total = thisYearBooks.length;
  const progress = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;
  const remaining = Math.max(0, goal - total);

  // 월별 카운트
  const monthly = MONTHS.map((_, i) => 0);
  thisYearBooks.forEach((b) => {
    const m = parseInt(b.date.slice(5, 7), 10) - 1;
    if (m >= 0 && m < 12) monthly[m]++;
  });
  const maxMonthly = Math.max(1, ...monthly);

  // 페이스 (현재까지 월 기준)
  const monthsPassed = currentMonth + 1;
  const pace = monthsPassed > 0 ? (total / monthsPassed) * 12 : 0;

  const saveGoal = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem(GOAL_KEY, String(n));
    } else {
      setDraft(String(goal));
    }
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-12 pb-24">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            <span>{year} Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">독서 대시보드</h1>
        </header>

        {/* 목표 카드 */}
        <section className="rounded-2xl border border-border p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" strokeWidth={1.75} />
              <span>올해 목표</span>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-8 w-20 text-sm rounded-md"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); }}
                />
                <button
                  onClick={saveGoal}
                  className="p-1.5 rounded-md hover:bg-accent text-foreground"
                  aria-label="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDraft(String(goal)); setEditing(true); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent"
              >
                <Pencil className="w-3 h-3" />
                <span>수정</span>
              </button>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold tracking-tight">{total}</span>
            <span className="text-lg text-muted-foreground">/ {goal}권</span>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% 달성</span>
            <span>{remaining > 0 ? `${remaining}권 남음` : "🎉 목표 달성!"}</span>
          </div>
        </section>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard
            icon={<BookOpen className="w-4 h-4" strokeWidth={1.75} />}
            label="이번 달"
            value={`${monthly[currentMonth]}권`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" strokeWidth={1.75} />}
            label="연간 페이스"
            value={`${pace.toFixed(1)}권`}
          />
        </div>

        {/* 월별 차트 */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">월별 독서량</h2>
          <div className="space-y-2.5">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex items-center gap-3">
                <span className={`text-xs w-8 ${i === currentMonth ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {m}
                </span>
                <div className="flex-1 h-7 bg-secondary/50 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 ${i === currentMonth ? "bg-foreground" : "bg-muted-foreground/40"}`}
                    style={{ width: monthly[i] > 0 ? `${(monthly[i] / maxMonthly) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {monthly[i] > 0 ? `${monthly[i]}권` : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-border p-4">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
      {icon}
      <span>{label}</span>
    </div>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);
