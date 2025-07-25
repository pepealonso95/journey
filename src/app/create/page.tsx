"use client";

import { useState, useCallback, useEffect } from "react";
import { GoogleBooksService } from "@/lib/google-books";
import type { GoogleBook } from "@/lib/google-books";
import { generateShareUrl, ANONYMOUS_LIST_SIZE } from "@/lib/share-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Search, Copy, ChevronLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ComparisonState {
  newBook: GoogleBook;
  existingBook: GoogleBook;
  existingIndex: number;
}

export default function CreatePage() {
  const router = useRouter();
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comparison, setComparison] = useState<ComparisonState | null>(null);
  const [listTitle, setListTitle] = useState("");
  const googleBooksService = new GoogleBooksService();
  const isComplete = books.length === ANONYMOUS_LIST_SIZE;

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await googleBooksService.searchBooks(query, 20);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const startComparison = (newBook: GoogleBook) => {
    if (books.length === 0) {
      setBooks([newBook]);
      return;
    }

    // Start comparison from the last book in the list
    const lastIndex = books.length - 1;
    setComparison({
      newBook,
      existingBook: books[lastIndex],
      existingIndex: lastIndex
    });
  };

  const handleComparisonChoice = (chooseNew: boolean) => {
    if (!comparison) return;

    const { newBook, existingIndex } = comparison;
    
    if (chooseNew) {
      // New book should be read before the existing one
      // Continue comparing with previous books to find exact position
      if (existingIndex > 0) {
        setComparison({
          ...comparison,
          existingBook: books[existingIndex - 1],
          existingIndex: existingIndex - 1
        });
      } else {
        // We've reached the beginning - new book goes first
        const newBooks = [...books];
        newBooks.unshift(newBook);
        setBooks(newBooks);
        setComparison(null);
      }
    } else {
      // Existing book should be read first - new book goes after this position
      const newBooks = [...books];
      newBooks.splice(existingIndex + 1, 0, newBook);
      setBooks(newBooks);
      setComparison(null);
    }
  };

  const removeBook = (index: number) => {
    setBooks(books.filter((_, i) => i !== index));
  };

  const shareUrl = isComplete 
    ? generateShareUrl(books.map(b => b.id), listTitle)
    : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleViewList = () => {
    if (shareUrl) {
      const url = new URL(shareUrl);
      router.push(url.pathname + url.search);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link 
              href="https://x.com/pepealonsog" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Built by @pepealonsog
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="https://github.com/pepealonso95/journey/tree/main" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Open Source Repo
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Book List Display */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {Array.from({ length: ANONYMOUS_LIST_SIZE }).map((_, index) => {
              const book = books[index];
              return (
                <div key={index} className="relative">
                  <div className={cn(
                    "relative aspect-[2/3] rounded-md overflow-hidden mb-2",
                    book ? "shadow-md" : "bg-gray-100"
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
                        <button
                          onClick={() => removeBook(index)}
                          className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-2xl font-light text-gray-400">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  {book ? (
                    <div>
                      <h3 className="font-medium text-xs line-clamp-2 mb-1">
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
                      <p className="text-xs text-gray-400">Empty</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {comparison ? (
          /* Comparison Mode */
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center mb-8">
              Which should be read first?
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handleComparisonChoice(true)}
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
                onClick={() => handleComparisonChoice(false)}
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
        ) : isComplete ? (
          /* Completion Screen */
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-6">List complete!</h2>
            
            <div className="space-y-4">
              {/* List Title Input */}
              <div>
                <Input
                  type="text"
                  placeholder="Give your list a title (optional)"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  className="text-center text-lg font-medium bg-transparent border-gray-800 text-gray-900 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., "Learn Machine Learning", "Must reads before your MBA"
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={shareUrl || ''}
                  readOnly
                  className="flex-1 bg-transparent border-gray-800 text-gray-900"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={handleViewList} className="w-full">
                View List
              </Button>

              <p className="text-sm text-gray-500">
                <Link href="/api/auth/signin" className="underline">
                  Sign in
                </Link>
                {" "}to save this list
              </p>
            </div>
          </div>
        ) : (
          /* Search Mode */
          <div>
            <div className="max-w-xl mx-auto mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pr-10 bg-transparent border-gray-800 text-gray-900 placeholder:text-gray-500"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-gray-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <Button onClick={handleSearch} disabled={searching} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results - Horizontal scroll on desktop, grid on mobile */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-500 mb-3">
                  {searchResults.length} results
                </h3>
                
                {/* Desktop: Horizontal scroll */}
                <div className="hidden md:block overflow-x-auto pb-2">
                  <div className="flex gap-6 w-max">
                    {searchResults.map((book) => {
                      const isAdded = books.some(b => b.id === book.id);
                      
                      return (
                        <button
                          key={book.id}
                          onClick={() => !isAdded && books.length < ANONYMOUS_LIST_SIZE && startComparison(book)}
                          disabled={isAdded || books.length >= ANONYMOUS_LIST_SIZE}
                          className={cn(
                            "text-left transition-opacity",
                            (isAdded || books.length >= ANONYMOUS_LIST_SIZE) && "opacity-40 cursor-not-allowed"
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
                  {searchResults.map((book) => {
                    const isAdded = books.some(b => b.id === book.id);
                    
                    return (
                      <button
                        key={book.id}
                        onClick={() => !isAdded && books.length < ANONYMOUS_LIST_SIZE && startComparison(book)}
                        disabled={isAdded || books.length >= ANONYMOUS_LIST_SIZE}
                        className={cn(
                          "text-left transition-opacity",
                          (isAdded || books.length >= ANONYMOUS_LIST_SIZE) && "opacity-40 cursor-not-allowed"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}