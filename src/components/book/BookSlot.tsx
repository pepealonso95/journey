import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoogleBook } from "@/lib/google-books";

interface BookSlotProps {
  book?: GoogleBook;
  index: number;
  onRemove?: (index: number) => void;
}

export function BookSlot({ book, index, onRemove }: BookSlotProps) {
  return (
    <div className="relative">
      <div className={cn(
        "relative aspect-[2/3] rounded-md overflow-hidden mb-2",
        book ? "shadow-md" : "bg-gray-100 border-2 border-dashed border-gray-300"
      )}>
        {book ? (
          <>
            {book.volumeInfo.imageLinks?.thumbnail ? (
              <Image
                src={book.volumeInfo.imageLinks.thumbnail}
                alt={book.volumeInfo.title}
                fill
                className="object-cover"
                sizes="120px"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <span className="text-xs text-gray-500">No cover</span>
              </div>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl font-light text-gray-400">{index + 1}</span>
          </div>
        )}
      </div>
      {book ? (
        <div>
          <h3 className="font-medium text-xs line-clamp-2 mb-1 text-gray-900">
            {book.volumeInfo.title}
          </h3>
          {book.volumeInfo.authors && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {book.volumeInfo.authors[0]}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xs text-gray-500">Empty</p>
        </div>
      )}
    </div>
  );
}