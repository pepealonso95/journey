import Image from "next/image";
import type { GoogleBook } from "@/lib/google-books";

interface ComparisonState {
  newBook: GoogleBook;
  existingBook: GoogleBook;
  existingIndex: number;
}

interface BookComparisonProps {
  comparison: ComparisonState;
  onChoice: (chooseNew: boolean) => void;
}

export function BookComparison({ comparison, onChoice }: BookComparisonProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-center mb-8">
        Which should be read first?
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onChoice(true)}
          className="group bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-32 flex-shrink-0">
              {comparison.newBook.volumeInfo.imageLinks?.thumbnail ? (
                <Image
                  src={comparison.newBook.volumeInfo.imageLinks.thumbnail}
                  alt={comparison.newBook.volumeInfo.title}
                  fill
                  className="object-cover rounded"
                  sizes="80px"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 rounded">
                  <span className="text-xs text-gray-500">No cover</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">New book</div>
              <h3 className="font-medium mb-1 line-clamp-2">
                {comparison.newBook.volumeInfo.title}
              </h3>
              {comparison.newBook.volumeInfo.authors && (
                <p className="text-sm text-gray-600">
                  {comparison.newBook.volumeInfo.authors[0]}
                </p>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() => onChoice(false)}
          className="group bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-32 flex-shrink-0">
              {comparison.existingBook.volumeInfo.imageLinks?.thumbnail ? (
                <Image
                  src={comparison.existingBook.volumeInfo.imageLinks.thumbnail}
                  alt={comparison.existingBook.volumeInfo.title}
                  fill
                  className="object-cover rounded"
                  sizes="80px"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 rounded">
                  <span className="text-xs text-gray-500">No cover</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Position {comparison.existingIndex + 1}</div>
              <h3 className="font-medium mb-1 line-clamp-2">
                {comparison.existingBook.volumeInfo.title}
              </h3>
              {comparison.existingBook.volumeInfo.authors && (
                <p className="text-sm text-gray-600">
                  {comparison.existingBook.volumeInfo.authors[0]}
                </p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}