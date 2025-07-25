import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GoogleBook } from "@/lib/google-books";

interface SearchResultsProps {
  results: GoogleBook[];
  books: GoogleBook[];
  maxSize: number;
  onSelectBook: (book: GoogleBook) => void;
}

export function SearchResults({ results, books, maxSize, onSelectBook }: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm text-gray-500 mb-3">
        {results.length} results
      </h3>
      
      {/* Desktop: Horizontal scroll */}
      <div className="hidden md:block overflow-x-auto pb-2">
        <div className="flex gap-6 w-max">
          {results.map((book) => {
            const isAdded = books.some(b => b.id === book.id);
            
            return (
              <button
                key={book.id}
                onClick={() => !isAdded && books.length < maxSize && onSelectBook(book)}
                disabled={isAdded || books.length >= maxSize}
                className={cn(
                  "text-left transition-opacity",
                  (isAdded || books.length >= maxSize) && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="relative w-32 h-48 mb-2">
                  {book.volumeInfo.imageLinks?.thumbnail ? (
                    <Image
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      fill
                      className="object-cover rounded shadow-md"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded shadow-md">
                      <span className="text-xs text-gray-500">No cover</span>
                    </div>
                  )}
                  {isAdded && (
                    <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Added</span>
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm line-clamp-2 mb-1 max-w-[128px]">
                  {book.volumeInfo.title}
                </h4>
                {book.volumeInfo.authors && (
                  <p className="text-xs text-gray-600 line-clamp-1 max-w-[128px]">
                    {book.volumeInfo.authors[0]}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Grid */}
      <div className="md:hidden grid grid-cols-3 gap-4">
        {results.map((book) => {
          const isAdded = books.some(b => b.id === book.id);
          
          return (
            <button
              key={book.id}
              onClick={() => !isAdded && books.length < maxSize && onSelectBook(book)}
              disabled={isAdded || books.length >= maxSize}
              className={cn(
                "text-left transition-opacity",
                (isAdded || books.length >= maxSize) && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className="relative aspect-[2/3] mb-2">
                {book.volumeInfo.imageLinks?.thumbnail ? (
                  <Image
                    src={book.volumeInfo.imageLinks.thumbnail}
                    alt={book.volumeInfo.title}
                    fill
                    className="object-cover rounded shadow-md"
                    sizes="33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 rounded shadow-md">
                    <span className="text-xs text-gray-500">No cover</span>
                  </div>
                )}
                {isAdded && (
                  <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Added</span>
                  </div>
                )}
              </div>
              <h4 className="font-medium text-xs line-clamp-2 mb-1">
                {book.volumeInfo.title}
              </h4>
              {book.volumeInfo.authors && (
                <p className="text-xs text-gray-600 line-clamp-1">
                  {book.volumeInfo.authors[0]}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}