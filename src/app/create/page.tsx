"use client";

import { useState, useCallback, useEffect } from "react";
import { searchBooks } from "@/lib/google-books";
import type { GoogleBook } from "@/lib/google-books";
import { generateShareUrl, ANONYMOUS_LIST_SIZE } from "@/lib/share-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Copy, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { BookList, SearchResults, BookComparison } from "@/components/book";

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
  const [comparison, setComparison] = useState<ComparisonState | null>(null);
  const [listTitle, setListTitle] = useState("");
  const isComplete = books.length === ANONYMOUS_LIST_SIZE;

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchBooks(query, 20);
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
      <Header>
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <BookList
          books={books}
          maxSize={ANONYMOUS_LIST_SIZE}
          onRemoveBook={removeBook}
          className="mb-6"
        />

        {comparison ? (
          <BookComparison 
            comparison={comparison} 
            onChoice={handleComparisonChoice} 
          />
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
                  e.g., &ldquo;Learn Machine Learning&rdquo;, &ldquo;Must reads before your MBA&rdquo;
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

            <SearchResults
              results={searchResults}
              books={books}
              maxSize={ANONYMOUS_LIST_SIZE}
              onSelectBook={startComparison}
            />
          </div>
        )}
      </div>
    </div>
  );
}