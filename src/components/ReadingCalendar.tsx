import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Book } from "@/lib/storage";
import sparkleImg from "@/assets/doodle-sparkle.png";

interface Props {
  books: Book[];
  onSelect: (id: string) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const ReadingCalendar = ({ books, onSelect }: Props) => {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const booksByDate = useMemo(() => {
    const map = new Map<string, Book[]>();
    books.forEach((b) => {
      const key = b.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [books]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const fmt = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const monthBooks = books.filter((b) => {
    const [y, m] = b.date.split("-");
    return parseInt(y) === year && parseInt(m) - 1 === month;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-10 pb-32">
        <header className="relative mb-6">
          <img src={sparkleImg} alt="" aria-hidden className="absolute -top-2 right-4 w-12 h-12 animate-wiggle" />
          <p className="font-handwrite text-xl text-primary mb-1">{year} ✿ Calendar</p>
          <h1 className="font-handwrite text-5xl text-foreground leading-none">독서 캘린더</h1>
        </header>

        <div className="doodle-card p-4 sm:p-5 mb-5">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="p-2 rounded-full hover:bg-accent text-foreground"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-handwrite text-3xl text-foreground">
              {year}년 {month + 1}월
            </h2>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="p-2 rounded-full hover:bg-accent text-foreground"
              aria-label="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`font-doodle text-xs text-center py-1 ${
                  i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} className="aspect-square" />;
              const key = fmt(d);
              const dayBooks = booksByDate.get(key) ?? [];
              const isToday =
                d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border-2 p-0.5 flex flex-col items-center overflow-hidden ${
                    isToday ? "border-primary bg-primary-soft" : "border-border/50 bg-card"
                  }`}
                >
                  <span
                    className={`font-doodle text-[10px] sm:text-xs leading-none mb-0.5 ${
                      isToday ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {d}
                  </span>
                  <div className="flex-1 w-full flex items-center justify-center gap-0.5 flex-wrap">
                    {dayBooks.slice(0, 2).map((b) =>
                      b.cover_url ? (
                        <button
                          key={b.id}
                          onClick={() => onSelect(b.id)}
                          className="w-full h-full overflow-hidden rounded"
                          title={b.title}
                        >
                          <img
                            src={b.cover_url}
                            alt={b.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <button
                          key={b.id}
                          onClick={() => onSelect(b.id)}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          title={b.title}
                          aria-label={b.title}
                        />
                      )
                    )}
                    {dayBooks.length > 2 && (
                      <span className="font-doodle text-[8px] text-muted-foreground">
                        +{dayBooks.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이번 달 읽은 책 목록 */}
        <section>
          <h3 className="font-handwrite text-2xl text-foreground mb-3">
            ✿ {month + 1}월에 읽은 책 ({monthBooks.length}권)
          </h3>
          {monthBooks.length === 0 ? (
            <p className="font-doodle text-sm text-muted-foreground py-6 text-center">
              아직 이 달에 기록된 책이 없어요
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {monthBooks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelect(b.id)}
                  className="doodle-card p-2 flex flex-col items-center text-left"
                >
                  <div className="w-full aspect-[2/3] bg-accent/60 rounded-lg overflow-hidden mb-2 border-2 border-border">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-handwrite text-2xl text-muted-foreground">
                        📖
                      </div>
                    )}
                  </div>
                  <p className="font-doodle text-xs text-foreground line-clamp-2 leading-tight w-full">
                    {b.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};