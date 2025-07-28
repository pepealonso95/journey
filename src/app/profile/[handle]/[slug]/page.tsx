import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ExternalLink, ArrowLeft, Calendar, User, Twitter, Copy, BookOpen, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-server';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { LikeButton } from '@/components/ui/LikeButton';

// Utility function to clean HTML tags from descriptions
function cleanDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> tags with spaces
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Utility function to get the best Google Books link for a book
function getGoogleBooksLink(book: any): string {
  if (book.infoLink) {
    return book.infoLink;
  }
  if (book.previewLink) {
    return book.previewLink;
  }
  return `https://books.google.com/books?id=${book.id}`;
}

export default async function UserListPage({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle: rawHandle, slug: rawSlug } = await params;
  const handle = decodeURIComponent(rawHandle);
  const slug = decodeURIComponent(rawSlug);

  try {
    const listData = await api.bookList.getByUserAndSlug({ 
      twitterHandle: handle, 
      slug 
    });

  
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-4">
          {/* List Title and Owner Info */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {listData.title}
            </h1>
            
            {/* Owner Information */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {listData.user.image ? (
                <Image
                  src={listData.user.image}
                  alt={listData.user.name || listData.user.twitterHandle || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              
              <Link
                href={`/profile/${handle}`}
                className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {listData.user.name || listData.user.twitterHandle}
              </Link>
              
              {listData.user.twitterProfileUrl && (
                <Link
                  href={listData.user.twitterProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  title="View on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </Link>
              )}
            </div>
            
            {/* List Description */}
            {listData.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {listData.description}
              </p>
            )}
          </div>


          {(!listData.books || listData.books.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No books found in this list.</p>
            </div>
          ) : (
            <>
              {/* Desktop: 4-column grid */}
              <div className="hidden lg:flex lg:justify-center">
                <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${listData.books.length}, minmax(0, 1fr))` }}>
                  {listData.books.map((book, index) => {
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
                          {book.large || book.medium || book.thumbnail ? (
                            <Image
                              src={book.large || book.medium || book.thumbnail || ''}
                              alt={book.title || 'Book cover'}
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
                          {book.title}
                          <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h2>
                      </a>
                      
                      {book.authors && (
                        <p className="text-lg text-gray-600 mb-4">
                          {(() => {
                            try {
                              if (typeof book.authors === 'string') {
                                const parsed = JSON.parse(book.authors);
                                return Array.isArray(parsed) ? parsed.join(", ") : '';
                              }
                              return '';
                            } catch {
                              return '';
                            }
                          })()}
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
                      {book.description && (
                        <p className="text-gray-500 leading-relaxed text-sm line-clamp-6">
                          {cleanDescription(book.description)}
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
            <div className="grid gap-12" style={{ gridTemplateColumns: listData.books.length === 1 ? '1fr' : listData.books.length <= 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}>
              {listData.books.map((book, index) => {
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
                          {book.large || book.medium || book.thumbnail ? (
                            <Image
                              src={book.large || book.medium || book.thumbnail || ''}
                              alt={book.title || 'Book cover'}
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
                          {book.title}
                          <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h2>
                      </a>
                      
                      {book.authors && (
                        <p className="text-lg text-gray-600 mb-4">
                          {(() => {
                            try {
                              if (typeof book.authors === 'string') {
                                const parsed = JSON.parse(book.authors);
                                return Array.isArray(parsed) ? parsed.join(", ") : '';
                              }
                              return '';
                            } catch {
                              return '';
                            }
                          })()}
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
                      {book.description && (
                        <p className="text-gray-500 leading-relaxed text-sm line-clamp-6">
                          {cleanDescription(book.description)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: Single column */}
          <div className="md:hidden max-w-lg mx-auto">
            {listData.books.map((book, index) => {
              const googleBooksUrl = getGoogleBooksLink(book);
              return (
                <div key={book.id} className="mb-12 last:mb-0">
                  {/* Book Cover */}
                  <div className="mb-6 text-center">
                    <a
                      href={googleBooksUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block group"
                    >
                      <div className="relative w-48 h-72 mx-auto mb-4 transition-transform group-hover:scale-105">
                        {book.large || book.medium || book.thumbnail ? (
                          <Image
                            src={book.large || book.medium || book.thumbnail || ''}
                            alt={book.title || 'Book cover'}
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
                  <div className="text-center">
                    <a
                      href={googleBooksUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                        {book.title}
                        <ExternalLink className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h2>
                    </a>
                    
                    {book.authors && (
                      <p className="text-lg text-gray-600 mb-4">
                        {(() => {
                          try {
                            if (typeof book.authors === 'string') {
                              const parsed = JSON.parse(book.authors);
                              return Array.isArray(parsed) ? parsed.join(", ") : book.authors;
                            }
                            return '';
                          } catch {
                            return typeof book.authors === 'string' ? book.authors : '';
                          }
                        })()}
                      </p>
                    )}
                    
                    {/* Custom Description from List Creator */}
                    {book.customDescription && (
                      <div className="mb-3 bg-blue-50 p-3 rounded mx-auto max-w-sm">
                        <p className="text-sm font-medium text-blue-900 mb-1">Why this book?</p>
                        <p className="text-sm text-blue-800 italic">"{book.customDescription}"</p>
                      </div>
                    )}
                    
                    {/* Book's Original Description */}
                    {book.description && (
                      <p className="text-gray-500 leading-relaxed text-sm mx-auto max-w-sm">
                        {cleanDescription(book.description)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

          {/* Action buttons - compact horizontal layout */}
          <div className="mt-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Left side - Like button and text */}
                  <div className="flex items-center gap-4">
                    <LikeButton
                      bookListId={listData.id}
                      initialLikeCount={listData.likeCount || 0}
                      size="md"
                      variant="default"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Enjoyed this list?
                      </h3>
                      <p className="text-sm text-gray-600">
                        Show your appreciation or create your own
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Action buttons */}
                  <div className="flex gap-3 ml-auto">
                    <Link href={`/profile/${handle}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        View Profile
                      </Button>
                    </Link>
                    
                    <Link href={`/create?slug=${slug}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Modify List
                      </Button>
                    </Link>
                    
                    <Link href="/create">
                      <Button size="sm" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Create New
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error fetching user list:', error);
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle: rawHandle, slug: rawSlug } = await params;
  const handle = decodeURIComponent(rawHandle);
  const slug = decodeURIComponent(rawSlug);
  
  try {
    const listData = await api.bookList.getByUserAndSlug({ 
      twitterHandle: handle, 
      slug 
    });
    
    const bookTitles = listData.books.slice(0, 3).map(book => book.title).join(', ');
    const description = listData.description || 
      `A book list by @${handle}${bookTitles ? ` featuring ${bookTitles}` : ''}`;
    
    return {
      title: `${listData.title} by @${handle} - Journey`,
      description,
      openGraph: {
        title: `${listData.title} by @${handle}`,
        description,
        type: 'article',
        url: `/profile/${handle}/${slug}`,
        images: listData.books[0]?.thumbnail ? [listData.books[0].thumbnail] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${listData.title} by @${handle}`,
        description,
        creator: `@${handle}`,
        images: listData.books[0]?.thumbnail ? [listData.books[0].thumbnail] : [],
      },
    };
  } catch (error) {
    return {
      title: `List by @${handle} - Journey`,
      description: `A book list by @${handle}`,
    };
  }
}