import { BookSlot } from "./BookSlot";
import type { GoogleBook } from "@/lib/google-books";

interface BookListProps {
  books: GoogleBook[];
  maxSize: number;
  onRemoveBook?: (index: number) => void;
  className?: string;
}

export function BookList({ books, maxSize, onRemoveBook, className }: BookListProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        {Array.from({ length: maxSize }).map((_, index) => (
          <BookSlot
            key={index}
            book={books[index]}
            index={index}
            onRemove={onRemoveBook}
          />
        ))}
      </div>
    </div>
  );
}