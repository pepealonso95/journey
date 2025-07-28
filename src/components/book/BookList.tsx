import { BookSlot } from "./BookSlot";
import type { GoogleBook } from "@/lib/google-books";

interface BookWithDescription extends GoogleBook {
  customDescription?: string;
}

interface BookListProps {
  books: BookWithDescription[];
  maxSize: number;
  onRemoveBook?: (index: number) => void;
  onDescriptionChange?: (index: number, description: string) => void;
  className?: string;
}

export function BookList({ books, maxSize, onRemoveBook, onDescriptionChange, className }: BookListProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {Array.from({ length: maxSize }).map((_, index) => (
          <BookSlot
            key={index}
            book={books[index]}
            index={index}
            onRemove={onRemoveBook}
            customDescription={books[index]?.customDescription}
            onDescriptionChange={onDescriptionChange ? (desc) => onDescriptionChange(index, desc) : undefined}
          />
        ))}
      </div>
    </div>
  );
}