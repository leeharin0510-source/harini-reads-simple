import { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";
import { Book } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import sproutImg from "@/assets/doodle-sprout.png";
import flowerImg from "@/assets/doodle-flower.png";
import sunImg from "@/assets/doodle-sun.png";
import cloudImg from "@/assets/doodle-cloud.png";
import sparkleImg from "@/assets/doodle-sparkle.png";

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

  const monthly = MONTHS.map(() => 0);
  thisYearBooks.forEach((b) => {
    const m = parseInt(b.date.slice(5, 7), 10) - 1;
    if (m >= 0 && m < 12) monthly[m]++;
  });
  const maxMonthly = Math.max(1, ...monthly);

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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-10 pb-28">
        <header className="relative mb-6">
          <img src={sparkleImg} alt="" aria-hidden className="absolute -top-2 right-4 w-12 h-12 animate-wiggle" />
          <p className="font-handwrite text-xl text-primary mb-1">{year} ✿ Stats</p>
          <h1 className="font-handwrite text-5xl text-foreground leading-none">대시보드</h1>
        </header>

        {/* 목표 카드 */}
        <section className="doodle-card p-5 mb-4 relative overflow-hidden">
          <img src={sunImg} alt="" aria-hidden className="absolute -top-6 -right-6 w-24 h-24 opacity-50" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="font-handwrite text-2xl text-foreground">🎯 올해 목표</p>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-9 w-20 text-base rounded-xl border-2 font-doodle"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); }}
                  />
                  <button
                    onClick={saveGoal}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90"
                    aria-label="저장"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setDraft(String(goal)); setEditing(true); }}
                  className="flex items-center gap-1 font-doodle text-sm text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full hover:bg-primary-soft"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>수정</span>
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-handwrite text-6xl text-primary leading-none">{total}</span>
              <span className="font-doodle text-2xl text-muted-foreground">/ {goal}권</span>
            </div>

            <div className="h-3 bg-accent rounded-full overflow-hidden mb-2 border-2 border-border">
              <div
                className="h-full bg-primary transition-all duration-700 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-doodle text-sm">
              <span className="text-muted-foreground">{progress.toFixed(0)}% 달성</span>
              <span className="text-foreground font-bold">
                {remaining > 0 ? `${remaining}권 남음` : "🎉 목표 달성!"}
              </span>
            </div>
          </div>
        </section>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            doodle={sproutImg}
            label="이번 달"
            value={`${monthly[currentMonth]}권`}
          />
          <StatCard
            doodle={flowerImg}
            label="연간 페이스"
            value={`${pace.toFixed(1)}권`}
          />
        </div>

        {/* 월별 차트 */}
        <section className="doodle-card p-5 relative">
          <img src={cloudImg} alt="" aria-hidden className="absolute top-3 right-3 w-12 h-10 opacity-60 animate-float" />
          <h2 className="font-handwrite text-2xl text-foreground mb-4">📊 월별 독서량</h2>
          <div className="space-y-2">
            {MONTHS.map((m, i) => {
              const isCurrent = i === currentMonth;
              return (
                <div key={m} className="flex items-center gap-3">
                  <span className={`font-doodle text-sm w-9 ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {m}
                  </span>
                  <div className="flex-1 h-7 bg-accent/40 rounded-full overflow-hidden border-2 border-border/50">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${isCurrent ? "bg-primary" : "bg-sky"}`}
                      style={{ width: monthly[i] > 0 ? `${(monthly[i] / maxMonthly) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className={`font-doodle text-sm w-10 text-right ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {monthly[i] > 0 ? `${monthly[i]}권` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 카테고리별 분포 */}
        <section className="doodle-card p-5 relative mt-4">
          <h2 className="font-handwrite text-2xl text-foreground mb-4">🏷️ 카테고리별</h2>
          {(() => {
            const counts = new Map<string, number>();
            thisYearBooks.forEach((b) => {
              const key = b.category || "미분류";
              counts.set(key, (counts.get(key) ?? 0) + 1);
            });
            const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
            const max = Math.max(1, ...entries.map(([, n]) => n));
            if (entries.length === 0) {
              return <p className="font-doodle text-sm text-muted-foreground">아직 기록이 없어요</p>;
            }
            return (
              <div className="space-y-2">
                {entries.map(([name, n]) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="font-doodle text-sm w-28 truncate text-muted-foreground">{name}</span>
                    <div className="flex-1 h-7 bg-accent/40 rounded-full overflow-hidden border-2 border-border/50">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </div>
                    <span className="font-doodle text-sm w-10 text-right text-foreground font-bold">{n}권</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ doodle, label, value }: { doodle: string; label: string; value: string }) => (
  <div className="doodle-card p-4 relative overflow-hidden">
    <img src={doodle} alt="" aria-hidden className="absolute -bottom-2 -right-2 w-16 h-16 opacity-70" />
    <div className="relative">
      <p className="font-doodle text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-handwrite text-3xl text-foreground">{value}</p>
    </div>
  </div>
);
