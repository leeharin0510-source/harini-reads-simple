import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bold, Italic, Underline, Type, Palette, Check } from "lucide-react";
import { Book, updateBook } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  book: Book;
  onBack: () => void;
}

const COLORS = [
  { name: "기본", value: "inherit" },
  { name: "회색", value: "#787774" },
  { name: "갈색", value: "#9F6B53" },
  { name: "주황", value: "#D9730D" },
  { name: "노랑", value: "#CB912F" },
  { name: "초록", value: "#448361" },
  { name: "파랑", value: "#337EA9" },
  { name: "보라", value: "#9065B0" },
  { name: "빨강", value: "#D44C47" },
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

  const handleInput = () => {
    setSaved(false);
    const html = editorRef.current?.innerHTML || "";
    updateBook(book.id, { note: html });
    setTimeout(() => setSaved(true), 300);
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-2 -ml-2 rounded-md hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록</span>
          </button>
          <span className="text-xs text-muted-foreground">
            {saved ? "저장됨" : "저장 중…"}
          </span>
        </div>

        {/* Toolbar */}
        <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-2 flex items-center gap-0.5 overflow-x-auto">
          <ToolButton onClick={() => exec("bold")} aria-label="굵게"><Bold className="w-4 h-4" /></ToolButton>
          <ToolButton onClick={() => exec("italic")} aria-label="기울임"><Italic className="w-4 h-4" /></ToolButton>
          <ToolButton onClick={() => exec("underline")} aria-label="밑줄"><Underline className="w-4 h-4" /></ToolButton>
          <Divider />
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 px-2.5 rounded-md hover:bg-accent text-foreground flex items-center gap-1 text-sm flex-shrink-0">
                <Type className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1.5 rounded-xl">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFontSize(s.value)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center justify-between"
                >
                  <span style={{ fontSize: s.value === "28px" ? "18px" : s.value }}>{s.name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 px-2.5 rounded-md hover:bg-accent text-foreground flex items-center gap-1 text-sm flex-shrink-0">
                <Palette className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1.5 rounded-xl">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => exec("foreColor", c.value)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2.5"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border"
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
        <div className="mb-6 pb-5 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{book.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {book.author} · {book.date.replace(/-/g, ".")}
          </p>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          data-placeholder="이 책에서 인상 깊었던 점을 적어보세요…"
          className="notion-editor min-h-[60vh] outline-none text-[16px] leading-[1.75] text-foreground"
        />
      </main>
    </div>
  );
};

const ToolButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    onMouseDown={(e) => e.preventDefault()}
    className="h-9 w-9 rounded-md hover:bg-accent text-foreground flex items-center justify-center flex-shrink-0"
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />;
