import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bold, Italic, Underline, Type, Palette, ImagePlus, Loader2 } from "lucide-react";
import { Book, updateBook, uploadNoteImage } from "@/lib/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(true);
  const [uploading, setUploading] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = book.note || "";
      initialised.current = true;
      enhanceImages(editorRef.current);
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

  // 이미지를 contentEditable에 삽입
  const insertImage = (url: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.draggable = true;
    img.className = "note-image";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      // 커서를 이미지 뒤로
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.appendChild(img);
    }
    handleInput();
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    for (const f of list) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: 5MB를 넘는 이미지는 올릴 수 없어요`);
        continue;
      }
      const url = await uploadNoteImage(f);
      if (url) insertImage(url);
      else toast.error("이미지 업로드 실패");
    }
    setUploading(false);
  };

  // 에디터 내 이미지 드래그 재배치
  const draggingRef = useRef<HTMLImageElement | null>(null);

  const onEditorDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      draggingRef.current = target as HTMLImageElement;
      e.dataTransfer.effectAllowed = "move";
      // 빈 데이터라도 넣어야 firefox에서 drag 동작
      e.dataTransfer.setData("text/plain", "");
    }
  };

  const onEditorDragOver = (e: React.DragEvent) => {
    if (draggingRef.current || (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files"))) {
      e.preventDefault();
      e.dataTransfer.dropEffect = draggingRef.current ? "move" : "copy";
    }
  };

  const onEditorDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    // 외부에서 파일 드롭 → 업로드 후 삽입
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      placeCaretFromPoint(e.clientX, e.clientY, editor);
      await handleFiles(e.dataTransfer.files);
      return;
    }

    // 내부 이미지 이동
    const dragged = draggingRef.current;
    draggingRef.current = null;
    if (!dragged) return;
    const range = caretRangeFromPoint(e.clientX, e.clientY);
    if (range && editor.contains(range.startContainer)) {
      range.insertNode(dragged);
      handleInput();
    }
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
          <Divider />
          <button
            onClick={() => fileInputRef.current?.click()}
            onMouseDown={(e) => e.preventDefault()}
            disabled={uploading}
            className="h-9 px-3 rounded-full bg-primary-soft hover:bg-primary/20 text-foreground flex items-center gap-1.5 flex-shrink-0 font-doodle text-sm disabled:opacity-60"
            aria-label="사진 추가"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            <span>사진</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
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
          onDragStart={onEditorDragStart}
          onDragOver={onEditorDragOver}
          onDrop={onEditorDrop}
          suppressContentEditableWarning
          data-placeholder="이 책에서 인상 깊었던 점을 적어보세요…"
          className="notion-editor font-doodle min-h-[60vh] outline-none text-[18px] leading-[1.8] text-foreground"
        />
        <p className="font-doodle text-xs text-muted-foreground mt-4">
          ✿ 사진은 툴바의 사진 아이콘을 누르거나 에디터에 드래그해서 추가해요. 추가된 사진은 잡아끌어서 위치를 옮길 수 있어요.
        </p>
      </main>
    </div>
  );
};

// 저장된 HTML에 들어 있는 <img> 들에도 드래그 가능 속성 부여
const enhanceImages = (root: HTMLElement) => {
  root.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "true");
    img.classList.add("note-image");
  });
};

// 좌표에서 caret Range 얻기 (크로스 브라우저)
const caretRangeFromPoint = (x: number, y: number): Range | null => {
  const doc: any = document;
  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    if (!pos) return null;
    const r = document.createRange();
    r.setStart(pos.offsetNode, pos.offset);
    r.collapse(true);
    return r;
  }
  return null;
};

const placeCaretFromPoint = (x: number, y: number, editor: HTMLElement) => {
  const range = caretRangeFromPoint(x, y);
  const sel = window.getSelection();
  if (range && sel && editor.contains(range.startContainer)) {
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.focus();
  }
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
