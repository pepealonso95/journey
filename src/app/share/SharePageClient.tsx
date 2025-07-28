"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { parseShareUrl } from "@/lib/share-url";
import { BookCacheService } from "@/lib/book-cache";
import type { GoogleBook } from "@/lib/google-books";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, BookOpen, ChevronRight, ExternalLink, User, Twitter } from "lucide-react";
import { Header } from "@/components/layout";
import { api } from "@/lib/api";

// Utility function to clean HTML tags from descriptions
function cleanDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> tags with spaces
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Utility function to get the best Google Books link for a book
function getGoogleBooksLink(book: GoogleBook): string {
  // Priority: infoLink > previewLink > constructed URL from ID
  if (book.volumeInfo.infoLink) {
    return book.volumeInfo.infoLink;
  }
  if (book.volumeInfo.previewLink) {
    return book.volumeInfo.previewLink;
  }
  // Fallback: construct Google Books URL from book ID
  return `https://books.google.com/books?id=${book.id}`;
}

interface SharePageContentProps {
  slug?: string;
}

interface BookWithDescription extends GoogleBook {
  customDescription?: string;
}

function SharePageContent({ slug }: SharePageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [books, setBooks] = useState<BookWithDescription[]>([]);
  const [listTitle, setListTitle] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreatingCopy, setIsCreatingCopy] = useState(false);
  
  // Use tRPC query for slug-based loading
  const { data: bookListData, isLoading: isLoadingBookList, error: bookListError } = api.bookList.getPublic.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  // Get current user's twitter handle for navigation
  const { data: currentUser } = api.user.getCurrentUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Mutation for creating a copy of the list
  const createCopyMutation = api.bookList.createOwned.useMutation({
    onSuccess: (data) => {
      // Navigate to the new list in the user's profile
      if (currentUser?.twitterHandle) {
        router.push(`/profile/${currentUser.twitterHandle}/${data.list.slug}`);
      }
    },
    onError: (error) => {
      console.error('Failed to create copy:', error);
    },
  });

  // Load books from database (slug-based) or URL parameters (legacy)
  useEffect(() => {
    async function loadBooks() {
      if (slug) {
        // Slug-based loading handled by tRPC query
        return;
      }
      
      // Legacy URL parameter loading
      const parseResult = parseShareUrl(searchParams);
      
      if (!parseResult) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      const { bookIds, title } = parseResult;
      setListTitle(title);

      try {
        const validBooks = await BookCacheService.getBooksByIdsWithCache(bookIds);
        
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
  }, [searchParams, slug]);

  // Handle tRPC data for slug-based loading
  useEffect(() => {
    if (slug) {
      if (isLoadingBookList) {
        setLoading(true);
        return;
      }
      
      if (bookListError) {
        setError("Failed to load book list");
        setLoading(false);
        return;
      }
      
      if (!bookListData) {
        setError("Book list not found");
        setLoading(false);
        return;
      }
      
      // Transform database books to BookWithDescription format
      const transformedBooks: BookWithDescription[] = bookListData.books
        .filter(book => book.id && book.title) // Filter out books without IDs or titles
        .map(book => ({
        id: book.id!,
        volumeInfo: {
          title: book.title!,
          authors: book.authors ? JSON.parse(book.authors) : undefined,
          description: book.description || undefined,
          publishedDate: book.publishedDate || undefined,
          imageLinks: {
            thumbnail: book.thumbnail || undefined,
            smallThumbnail: book.smallThumbnail || undefined,
            medium: book.medium || undefined,
            large: book.large || undefined,
            extraLarge: book.extraLarge || undefined,
          },
          industryIdentifiers: [
            ...(book.isbn10 ? [{ type: 'ISBN_10', identifier: book.isbn10 }] : []),
            ...(book.isbn13 ? [{ type: 'ISBN_13', identifier: book.isbn13 }] : []),
          ],
          pageCount: book.pageCount || undefined,
          categories: book.categories ? JSON.parse(book.categories) : undefined,
          language: book.language || undefined,
          previewLink: book.previewLink || undefined,
          infoLink: book.infoLink || undefined,
          canonicalVolumeLink: book.canonicalVolumeLink || undefined,
        },
        customDescription: book.customDescription || undefined,
      }));
      
      setBooks(transformedBooks);
      setListTitle(bookListData.title);
      setLoading(false);
    }
  }, [slug, bookListData, isLoadingBookList, bookListError]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyToProfile = async () => {
    if (!session || !books.length) return;
    
    setIsCreatingCopy(true);
    try {
      const booksWithDescriptions = books.map(book => ({
        id: book.id,
        customDescription: book.customDescription
      }));
      await createCopyMutation.mutateAsync({
        title: listTitle || "Copied Reading List",
        description: undefined,
        books: booksWithDescriptions,
      });
    } catch (error) {
      console.error('Failed to create copy:', error);
    } finally {
      setIsCreatingCopy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (error || books.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="flex flex-col items-center justify-center p-4 h-96">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* List Title and Owner Info */}
        <div className="text-center mb-6">
          {listTitle && (
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {listTitle}
            </h1>
          )}
          
          {/* Owner Information */}
          {bookListData && !bookListData.isAnonymous && bookListData.userName && (
            <div className="flex items-center justify-center gap-3 mb-4">
              {bookListData.userImage ? (
                <Image
                  src={bookListData.userImage}
                  alt={bookListData.userName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
              <div className="text-gray-600">
                <span>Curated by </span>
                {bookListData.userTwitterHandle ? (
                  <Link
                    href={`/profile/${bookListData.userTwitterHandle}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {bookListData.userName || `@${bookListData.userTwitterHandle}`}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">{bookListData.userName}</span>
                )}
              </div>
              
              {/* Twitter Link */}
              {bookListData.userTwitterProfileUrl && (
                <Link
                  href={bookListData.userTwitterProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  title="View on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
          
          {/* List Description */}
          {bookListData?.description && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {bookListData.description}
            </p>
          )}
        </div>
        {/* Desktop: 4-column grid */}
        <div className="hidden lg:flex lg:justify-center">
          <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${books.length}, minmax(0, 1fr))` }}>
          {books.map((book, index) => {
            const googleBooksUrl = getGoogleBooksLink(book);
            return (
              <div key={book.id} className="text-center">
                {/* Book Cover */}
                <div className="mb-6">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative w-48 h-72 mx-auto mb-4 transition-transform group-hover:scale-105">
                      {book.volumeInfo.imageLinks?.large || book.volumeInfo.imageLinks?.medium || book.volumeInfo.imageLinks?.thumbnail ? (
                        <Image
                          src={book.volumeInfo.imageLinks.large || book.volumeInfo.imageLinks.medium || book.volumeInfo.imageLinks.thumbnail || ''}
                          alt={book.volumeInfo.title}
                          fill
                          className="object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                          sizes="192px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg group-hover:bg-gray-300 transition-colors">
                          <span className="text-sm text-gray-500">No cover</span>
                        </div>
                      )}
                      {/* Overlay indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white bg-opacity-90 rounded-full p-1">
                          <ExternalLink className="h-3 w-3 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </a>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Book Details */}
                <div className="text-left">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                      {book.volumeInfo.title}
                      <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h2>
                  </a>
                  
                  {book.volumeInfo.authors && (
                    <p className="text-lg text-gray-600 mb-4">
                      {book.volumeInfo.authors.join(", ")}
                    </p>
                  )}
                  
                  {/* Custom Description from List Creator */}
                  {book.customDescription && (
                    <div className="mb-3 bg-blue-50 p-3 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Why this book?</p>
                      <p className="text-sm text-blue-800 italic">"{book.customDescription}"</p>
                    </div>
                  )}
                  
                  {/* Book's Original Description */}
                  {book.volumeInfo.description && (
                    <p className="text-gray-500 leading-relaxed text-sm line-clamp-6">
                      {cleanDescription(book.volumeInfo.description)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Tablet: 2x2 Grid */}
        <div className="hidden md:flex md:justify-center lg:hidden">
          <div className="grid gap-12" style={{ gridTemplateColumns: books.length === 1 ? '1fr' : books.length <= 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}>
          {books.map((book, index) => {
            const googleBooksUrl = getGoogleBooksLink(book);
            return (
              <div key={book.id} className="text-center">
                {/* Book Cover */}
                <div className="mb-6">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative w-40 h-60 mx-auto mb-4 transition-transform group-hover:scale-105">
                      {book.volumeInfo.imageLinks?.large || book.volumeInfo.imageLinks?.medium || book.volumeInfo.imageLinks?.thumbnail ? (
                        <Image
                          src={book.volumeInfo.imageLinks.large || book.volumeInfo.imageLinks.medium || book.volumeInfo.imageLinks.thumbnail || ''}
                          alt={book.volumeInfo.title}
                          fill
                          className="object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                          sizes="160px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg group-hover:bg-gray-300 transition-colors">
                          <span className="text-sm text-gray-500">No cover</span>
                        </div>
                      )}
                      {/* Overlay indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white bg-opacity-90 rounded-full p-1">
                          <ExternalLink className="h-3 w-3 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </a>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Book Details */}
                <div className="text-left">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                      {book.volumeInfo.title}
                      <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h2>
                  </a>
                  
                  {book.volumeInfo.authors && (
                    <p className="text-base text-gray-600 mb-3">
                      {book.volumeInfo.authors.join(", ")}
                    </p>
                  )}
                  
                  {/* Custom Description from List Creator */}
                  {book.customDescription && (
                    <div className="mb-3 bg-blue-50 p-2 rounded">
                      <p className="text-xs font-medium text-blue-900 mb-1">Why this book?</p>
                      <p className="text-xs text-blue-800 italic">"{book.customDescription}"</p>
                    </div>
                  )}
                  
                  {/* Book's Original Description */}
                  {book.volumeInfo.description && (
                    <p className="text-gray-500 leading-relaxed text-sm line-clamp-4">
                      {cleanDescription(book.volumeInfo.description)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Mobile: Single column */}
        <div className="md:hidden space-y-12">
          {books.map((book, index) => {
            const googleBooksUrl = getGoogleBooksLink(book);
            return (
              <div key={book.id} className="text-center">
                {/* Book Cover */}
                <div className="mb-6">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative w-32 h-48 mx-auto mb-4 transition-transform group-hover:scale-105">
                      {book.volumeInfo.imageLinks?.large || book.volumeInfo.imageLinks?.medium || book.volumeInfo.imageLinks?.thumbnail ? (
                        <Image
                          src={book.volumeInfo.imageLinks.large || book.volumeInfo.imageLinks.medium || book.volumeInfo.imageLinks.thumbnail || ''}
                          alt={book.volumeInfo.title}
                          fill
                          className="object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                          sizes="128px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg group-hover:bg-gray-300 transition-colors">
                          <span className="text-sm text-gray-500">No cover</span>
                        </div>
                      )}
                      {/* Overlay indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white bg-opacity-90 rounded-full p-1">
                          <ExternalLink className="h-3 w-3 text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </a>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Book Details */}
                <div className="text-left">
                  <a
                    href={googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                      {book.volumeInfo.title}
                      <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h2>
                  </a>
                  
                  {book.volumeInfo.authors && (
                    <p className="text-base text-gray-600 mb-3">
                      {book.volumeInfo.authors.join(", ")}
                    </p>
                  )}
                  
                  {/* Custom Description from List Creator */}
                  {book.customDescription && (
                    <div className="mb-3 bg-blue-50 p-2 rounded">
                      <p className="text-xs font-medium text-blue-900 mb-1">Why this book?</p>
                      <p className="text-xs text-blue-800 italic">"{book.customDescription}"</p>
                    </div>
                  )}
                  
                  {/* Book's Original Description */}
                  {book.volumeInfo.description && (
                    <p className="text-gray-500 leading-relaxed text-sm line-clamp-4">
                      {cleanDescription(book.volumeInfo.description)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
              
              <div className={`grid gap-3 ${session ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <Button 
                  onClick={handleCopyLink} 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Share"}
                </Button>
                
                {session && (
                  <Button 
                    onClick={handleCopyToProfile}
                    disabled={isCreatingCopy}
                    className="flex items-center justify-center gap-2"
                  >
                    {isCreatingCopy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {isCreatingCopy ? "Copying..." : "Copy to My Profile"}
                  </Button>
                )}
                
                <Link href={slug ? `/create?slug=${slug}` : `/create?${searchParams.toString()}`} className="flex">
                  <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Modify List
                  </Button>
                </Link>
                
                {!session && (
                  <Link href="/api/auth/signin" className="flex">
                    <Button className="flex-1">
                      Save to Account
                    </Button>
                  </Link>
                )}
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

interface SharePageClientProps {
  slug?: string;
}

export default function SharePageClient({ slug }: SharePageClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <SharePageContent slug={slug} />
    </Suspense>
  );
}