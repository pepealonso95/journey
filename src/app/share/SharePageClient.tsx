"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { parseShareUrl } from "@/lib/share-url";
import { getBookById } from "@/lib/google-books";
import type { GoogleBook } from "@/lib/google-books";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout";

// Utility function to clean HTML tags from descriptions
function cleanDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> tags with spaces
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

function SharePageContent() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [listTitle, setListTitle] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBooks() {
      const parseResult = parseShareUrl(searchParams);
      
      if (!parseResult) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      const { bookIds, title } = parseResult;
      setListTitle(title);

      try {
        const bookPromises = bookIds.map(id => getBookById(id));
        const loadedBooks = await Promise.all(bookPromises);
        
        // Filter out any failed loads but maintain order
        const validBooks = loadedBooks.filter(book => book !== null) as GoogleBook[];
        
        if (validBooks.length !== bookIds.length) {
          setError("Some books could not be loaded");
        }
        
        setBooks(validBooks);
      } catch (err) {
        console.error("Error loading books:", err);
        setError("Failed to load books");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [searchParams]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || books.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          {error || "No books found"}
        </h1>
        <p className="text-gray-600 mb-8">
          This share link appears to be invalid or expired.
        </p>
        <Link href="/create">
          <Button>Create Your Own List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header>
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronRight className="h-4 w-4 mr-1" />
          Journey
        </Link>
      </Header>
      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* List Title */}
        {listTitle && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {listTitle}
            </h1>
          </div>
        )}
        {/* Desktop: 4-column grid */}
        <div className="hidden lg:flex lg:justify-center">
          <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${books.length}, minmax(0, 1fr))` }}>
          {books.map((book, index) => (
            <div key={book.id} className="text-center">
              {/* Book Cover */}
              <div className="mb-6">
                <div className="relative w-48 h-72 mx-auto mb-4">
                  {book.volumeInfo.imageLinks?.thumbnail ? (
                    <Image
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      fill
                      className="object-cover rounded-lg shadow-lg"
                      sizes="192px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                      <span className="text-sm text-gray-500">No cover</span>
                    </div>
                  )}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Book Details */}
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                  {book.volumeInfo.title}
                </h2>
                
                {book.volumeInfo.authors && (
                  <p className="text-lg text-gray-600 mb-4">
                    {book.volumeInfo.authors.join(", ")}
                  </p>
                )}
                
                {book.volumeInfo.description && (
                  <p className="text-gray-500 leading-relaxed text-sm line-clamp-6">
                    {cleanDescription(book.volumeInfo.description)}
                  </p>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Tablet: 2x2 Grid */}
        <div className="hidden md:flex md:justify-center lg:hidden">
          <div className="grid gap-12" style={{ gridTemplateColumns: books.length === 1 ? '1fr' : books.length <= 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}>
          {books.map((book, index) => (
            <div key={book.id} className="text-center">
              {/* Book Cover */}
              <div className="mb-6">
                <div className="relative w-40 h-60 mx-auto mb-4">
                  {book.volumeInfo.imageLinks?.thumbnail ? (
                    <Image
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      fill
                      className="object-cover rounded-lg shadow-lg"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                      <span className="text-sm text-gray-500">No cover</span>
                    </div>
                  )}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Book Details */}
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                  {book.volumeInfo.title}
                </h2>
                
                {book.volumeInfo.authors && (
                  <p className="text-base text-gray-600 mb-3">
                    {book.volumeInfo.authors.join(", ")}
                  </p>
                )}
                
                {book.volumeInfo.description && (
                  <p className="text-gray-500 leading-relaxed text-sm line-clamp-4">
                    {cleanDescription(book.volumeInfo.description)}
                  </p>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Mobile: Single column */}
        <div className="md:hidden space-y-12">
          {books.map((book, index) => (
            <div key={book.id} className="text-center">
              {/* Book Cover */}
              <div className="mb-6">
                <div className="relative w-32 h-48 mx-auto mb-4">
                  {book.volumeInfo.imageLinks?.thumbnail ? (
                    <Image
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      fill
                      className="object-cover rounded-lg shadow-lg"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                      <span className="text-sm text-gray-500">No cover</span>
                    </div>
                  )}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {index + 1}
                </div>
              </div>

              {/* Book Details */}
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                  {book.volumeInfo.title}
                </h2>
                
                {book.volumeInfo.authors && (
                  <p className="text-base text-gray-600 mb-3">
                    {book.volumeInfo.authors.join(", ")}
                  </p>
                )}
                
                {book.volumeInfo.description && (
                  <p className="text-gray-500 leading-relaxed text-sm line-clamp-4">
                    {cleanDescription(book.volumeInfo.description)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="mt-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Like this list?
                </h3>
                <p className="text-gray-600 text-sm">
                  Share it, modify it, or save it to your account
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={handleCopyLink} 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Share"}
                </Button>
                
                <Link href={`/create?${searchParams.toString()}`} className="flex">
                  <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Modify List
                  </Button>
                </Link>
                
                <Link href="/api/auth/signin" className="flex">
                  <Button className="flex-1">
                    Save to Account
                  </Button>
                </Link>
              </div>
              
              <div className="mt-3 text-center">
                <Link href="/create" className="text-sm text-gray-500 hover:text-gray-700">
                  or create your own list from scratch →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SharePageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}