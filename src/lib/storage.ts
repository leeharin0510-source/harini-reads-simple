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
  localStorage.setItem(KEY, JSON.stringify([]));
  return [];
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
