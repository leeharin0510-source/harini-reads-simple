import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bold, Italic, Underline, Type, Palette } from "lucide-react";
import { Book, updateBook } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  book: Book;
  onBack: () => void;
}

const COLORS = [
  { name: "기본", value: "inherit" },
  { name: "민트", value: "#5BB89A" },
  { name: "하늘", value: "#7BB8DA" },
  { name: "분홍", value: "#E89BB0" },
  { name: "노랑", value: "#E5C547" },
  { name: "주황", value: "#E89559" },
  { name: "보라", value: "#A78BCB" },
  { name: "회색", value: "#8B8B8B" },
];

const SIZES = [
  { name: "작게", value: "14px" },
  { name: "보통", value: "16px" },
  { name: "크게", value: "20px" },
  { name: "제목", value: "28px" },
];

export const NoteEditor = ({ book, onBack }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(true);
  const initialised = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = book.note || "";
      initialised.current = true;
    }
  }, [book.note]);

  const saveTimer = useRef<number | null>(null);
  const handleInput = () => {
    setSaved(false);
    const html = editorRef.current?.innerHTML || "";
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await updateBook(book.id, { note: html });
      setSaved(true);
    }, 600);
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const setFontSize = (size: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    handleInput();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b-2 border-border">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 font-doodle text-base text-foreground hover:text-primary px-3 py-2 -ml-2 rounded-full hover:bg-primary-soft transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록</span>
          </button>
          <span className="font-doodle text-sm text-muted-foreground">
            {saved ? "✿ 저장됨" : "저장 중…"}
          </span>
        </div>

        <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-2 flex items-center gap-1 overflow-x-auto">
          <ToolButton onClick={() => exec("bold")} aria-label="굵게"><Bold className="w-4 h-4" /></ToolButton>
          <ToolButton onClick={() => exec("italic")} aria-label="기울임"><Italic className="w-4 h-4" /></ToolButton>
          <ToolButton onClick={() => exec("underline")} aria-label="밑줄"><Underline className="w-4 h-4" /></ToolButton>
          <Divider />
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 px-3 rounded-full hover:bg-primary-soft text-foreground flex items-center gap-1 flex-shrink-0">
                <Type className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2 rounded-2xl border-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFontSize(s.value)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-accent font-doodle flex items-center justify-between"
                >
                  <span style={{ fontSize: s.value === "28px" ? "20px" : s.value }}>{s.name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 px-3 rounded-full hover:bg-primary-soft text-foreground flex items-center gap-1 flex-shrink-0">
                <Palette className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 rounded-2xl border-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => exec("foreColor", c.value)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-accent font-doodle flex items-center gap-2.5"
                >
                  <span
                    className="w-5 h-5 rounded-full border-2 border-border"
                    style={{ backgroundColor: c.value === "inherit" ? "transparent" : c.value }}
                  />
                  <span style={{ color: c.value }}>{c.name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 sm:px-8 py-8">
        <div className="mb-6 pb-5 border-b-2 border-dashed border-border">
          <h1 className="font-handwrite text-4xl sm:text-5xl text-foreground leading-tight">{book.title}</h1>
          <p className="font-doodle text-base text-muted-foreground mt-2">
            ✿ {book.author} · {book.date.replace(/-/g, ".")}
          </p>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          data-placeholder="이 책에서 인상 깊었던 점을 적어보세요…"
          className="notion-editor font-doodle min-h-[60vh] outline-none text-[18px] leading-[1.8] text-foreground"
        />
      </main>
    </div>
  );
};

const ToolButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    onMouseDown={(e) => e.preventDefault()}
    className="h-9 w-9 rounded-full hover:bg-primary-soft text-foreground flex items-center justify-center flex-shrink-0"
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />;
