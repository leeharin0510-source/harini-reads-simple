export interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  note: string;
}

const KEY = "harin_reading_log_books";

export const loadBooks = (): Book[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: Book[] = [
    { id: "1", title: "달러구트 꿈 백화점", author: "이미예", date: "2025-01-12", note: "" },
    { id: "2", title: "역행자", author: "자청", date: "2025-02-08", note: "" },
    { id: "3", title: "미드나잇 라이브러리", author: "매트 헤이그", date: "2025-03-21", note: "" },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
};

export const saveBooks = (books: Book[]) => {
  localStorage.setItem(KEY, JSON.stringify(books));
};

export const updateBook = (id: string, patch: Partial<Book>) => {
  const books = loadBooks().map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveBooks(books);
};

export const addBook = (book: Omit<Book, "id" | "note">) => {
  const books = loadBooks();
  const newBook: Book = { ...book, id: Date.now().toString(), note: "" };
  saveBooks([newBook, ...books]);
  return newBook;
};

export const deleteBook = (id: string) => {
  saveBooks(loadBooks().filter((b) => b.id !== id));
};
