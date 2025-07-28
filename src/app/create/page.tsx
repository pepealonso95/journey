"use client";

import { useState, useCallback, useEffect, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getBookById } from "@/lib/google-books";
import type { GoogleBook } from "@/lib/google-books";
import { generateShareUrl, parseShareUrl, ANONYMOUS_LIST_SIZE, generateSessionSlug, generatePreviewUrl } from "@/lib/share-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Copy, ChevronLeft, Loader2, BookOpen, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout";
import { BookList, SearchResults, BookComparison } from "@/components/book";
import { api } from "@/lib/api";

interface BookWithDescription extends GoogleBook {
  customDescription?: string;
}

interface ComparisonState {
  newBook: GoogleBook;
  existingBook: BookWithDescription;
  existingIndex: number;
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [books, setBooks] = useState<BookWithDescription[]>([]);
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [comparison, setComparison] = useState<ComparisonState | null>(null);
  const [listTitle, setListTitle] = useState("");
  const [loadingExistingBooks, setLoadingExistingBooks] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sessionSlug, setSessionSlug] = useState<string | null>(null);
  const [previousSlugs, setPreviousSlugs] = useState<string[]>([]);
  const [basedOnExisting, setBasedOnExisting] = useState(false);
  const [isSavingToProfile, setIsSavingToProfile] = useState(false);
  const [isRegeneratingSlug, setIsRegeneratingSlug] = useState(false);
  const isComplete = books.length === ANONYMOUS_LIST_SIZE;
  const canShare = books.length >= 1;

  const createAnonymousListMutation = api.bookList.createAnonymous.useMutation();
  // Get current user's twitter handle for navigation
  const { data: currentUser } = api.user.getCurrentUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  const createUserListMutation = api.bookList.createOwned.useMutation({
    onSuccess: (data) => {
      // Navigate to the new list in user's profile
      if (currentUser?.twitterHandle) {
        router.push(`/profile/${currentUser.twitterHandle}/${data.list.slug}`);
      }
    },
    onError: (error) => {
      console.error('Failed to create user list:', error);
      setIsSavingToProfile(false);
    },
  });
  
  const slug = searchParams.get('slug');
  const { data: bookListData, isLoading: isLoadingSlugData } = api.bookList.getPublic.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  // Load existing books from slug (for modification/forking)
  useEffect(() => {
    if (slug && bookListData) {
      // Don't set edit mode - treat this as creating a new list based on existing one
      
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
      setBasedOnExisting(true);
      
      // Generate a new session slug for the modified list
      const newSlug = generateSessionSlug(bookListData.title);
      setSessionSlug(newSlug);
    }
  }, [slug, bookListData]);

  // Set loading state for slug data
  useEffect(() => {
    if (slug) {
      setLoadingExistingBooks(isLoadingSlugData);
    }
  }, [slug, isLoadingSlugData]);

  // Generate session slug immediately on page load (when not loading an existing list)
  useEffect(() => {
    if (!sessionSlug && !slug) {
      const newSlug = generateSessionSlug(""); // Start with empty title, will be updated on blur
      setSessionSlug(newSlug);
    }
  }, [sessionSlug, slug]); // Removed listTitle dependency to prevent infinite loop

  // Load existing books if URL parameters are present (edit mode)
  useEffect(() => {
    async function loadExistingBooks() {
      if (slug) {
        // Slug loading is handled by the tRPC query above
        return;
      }
      
      // Legacy URL parameter loading
      const parseResult = parseShareUrl(searchParams);
      if (!parseResult) return;

      const { bookIds, title } = parseResult;
      if (bookIds.length === 0) return;

      setIsEditMode(true);
      setLoadingExistingBooks(true);
      try {
        const bookPromises = bookIds.map(id => getBookById(id));
        const loadedBooks = await Promise.all(bookPromises);
        const validBooks = loadedBooks.filter(book => book !== null) as GoogleBook[];
        
        setBooks(validBooks);
        if (title) {
          setListTitle(title);
        }
      } catch (error) {
        console.error("Error loading existing books:", error);
      } finally {
        setLoadingExistingBooks(false);
      }
    }

    loadExistingBooks();
  }, [searchParams]);

  // Cleanup unused slugs when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any unused previous slugs
      if (previousSlugs.length > 0) {
        console.log('Cleaning up unused slugs:', previousSlugs);
        
        // Send cleanup request to server using sendBeacon for reliability during page unload
        if (navigator.sendBeacon) {
          const cleanupData = JSON.stringify({
            slugs: previousSlugs
          });
          navigator.sendBeacon('/api/cleanup-slugs', cleanupData);
        }
        // Remove the fallback that was causing infinite loops
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't call cleanup here as it was causing infinite loops
    };
  }, []); // Remove dependencies that were causing re-renders

  // Use tRPC query for book search with caching
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Extract categories from selected books for suggestions
  const getSelectedBookCategories = () => {
    const allCategories = books.flatMap(book => 
      book.volumeInfo.categories || []
    );
    
    // Remove duplicates and return most common categories
    const categoryCount = allCategories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 categories
      .map(([category]) => category);
  };

  const { data: searchData, isLoading: isSearching } = api.book.search.useQuery(
    { query: debouncedSearchQuery },
    { 
      enabled: !!debouncedSearchQuery.trim(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get suggestions based on selected book categories (memoized to prevent infinite loops)
  const selectedCategories = useMemo(() => {
    return getSelectedBookCategories();
  }, [books]); // Only recalculate when books change
  
  const excludeBookIds = useMemo(() => books.map(b => b.id), [books]);
  
  const { data: suggestionsData, isLoading: isLoadingSuggestions } = api.book.getSuggestions.useQuery(
    { 
      categories: selectedCategories,
      excludeBookIds: excludeBookIds
    },
    { 
      enabled: books.length > 0 && books.length < ANONYMOUS_LIST_SIZE && selectedCategories.length > 0 && !debouncedSearchQuery.trim(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Update search results when tRPC data changes
  useEffect(() => {
    if (searchData) {
      // Transform search results to GoogleBook format
      const transformedResults: GoogleBook[] = searchData.map(book => ({
        id: book.id,
        volumeInfo: {
          title: book.title,
          authors: book.authors,
          description: book.description,
          publishedDate: book.publishedDate,
          imageLinks: {
            thumbnail: book.thumbnail,
            smallThumbnail: book.smallThumbnail,
            medium: book.medium,
            large: book.large,
            extraLarge: book.extraLarge,
          },
          pageCount: book.pageCount,
          categories: book.categories,
          previewLink: book.previewLink,
          infoLink: book.infoLink,
        },
      }));
      setSearchResults(transformedResults);
    } else if (suggestionsData && !debouncedSearchQuery.trim()) {
      // Transform suggestions to GoogleBook format when no search query
      const transformedSuggestions: GoogleBook[] = suggestionsData.map(book => ({
        id: book.id,
        volumeInfo: {
          title: book.title,
          authors: book.authors,
          description: book.description || undefined,
          publishedDate: book.publishedDate || undefined,
          imageLinks: {
            thumbnail: book.thumbnail || undefined,
            smallThumbnail: book.smallThumbnail || undefined,
            medium: book.medium || undefined,
            large: book.large || undefined,
            extraLarge: book.extraLarge || undefined,
          },
          pageCount: book.pageCount || undefined,
          categories: book.categories,
          previewLink: book.previewLink || undefined,
          infoLink: book.infoLink || undefined,
        },
      }));
      setSearchResults(transformedSuggestions);
    } else if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
    }
  }, [searchData, suggestionsData, debouncedSearchQuery]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = useCallback(() => {
    // Trigger immediate search by updating debounced query
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleTitleBlur = async () => {
    // Regenerate slug when title changes (on blur)
    if (sessionSlug) {
      const newSlug = generateSessionSlug(listTitle);
      
      // Only update if the slug actually changed
      if (newSlug !== sessionSlug) {
        setIsRegeneratingSlug(true);
        
        // Add a small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Track the previous slug for potential cleanup
        setPreviousSlugs(prev => [...prev, sessionSlug]);
        setSessionSlug(newSlug);
        
        setIsRegeneratingSlug(false);
      }
    }
  };

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
    // Clear share URL when books change
    setShareUrl(null);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const updatedBooks = [...books];
    updatedBooks[index] = { ...updatedBooks[index], customDescription: description };
    setBooks(updatedBooks);
    // Clear share URL when descriptions change
    setShareUrl(null);
  };

  const createShareUrl = async () => {
    if (!canShare) return;
    
    try {
      // Try to create anonymous list in database
      const result = await createAnonymousListMutation.mutateAsync({
        title: listTitle || "Untitled Reading List",
        description: undefined,
        books: books.map(b => ({ 
          id: b.id, 
          customDescription: b.customDescription 
        })),
      });
      
      const fullUrl = `${window.location.origin}${result.shareUrl}`;
      setShareUrl(fullUrl);
      return fullUrl;
    } catch (error) {
      console.error("Failed to create database list, falling back to URL parameters:", error);
      
      // Fallback to old URL format if database fails
      const fallbackUrl = generateShareUrl(books.map(b => b.id), listTitle);
      setShareUrl(fallbackUrl);
      return fallbackUrl;
    }
  };


  const handleCopyLink = async () => {
    // Always use preview URL when sessionSlug is available, otherwise fallback to shareUrl
    const urlToCopy = sessionSlug ? generatePreviewUrl(sessionSlug) : shareUrl;
    
    if (urlToCopy) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        // Create database entry in background when copying preview URL
        if (sessionSlug && !shareUrl) {
          try {
            await createAnonymousListMutation.mutateAsync({
              slug: sessionSlug,
              title: listTitle || "Untitled Reading List",
              description: undefined,
              books: books.map(b => ({ 
                id: b.id, 
                customDescription: b.customDescription 
              })),
            });
          } catch (error) {
            console.error("Failed to create database entry (preview URL still works):", error);
          }
        }
      } catch (err) {
        console.error("Failed to copy:", err);
        // Fallback: try using the deprecated document.execCommand method
        try {
          const textArea = document.createElement('textarea');
          textArea.value = urlToCopy;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackError) {
          console.error("Fallback copy also failed:", fallbackError);
        }
      }
    }
  };

  const handleSaveToProfile = async () => {
    if (!session || !books.length) return;
    
    setIsSavingToProfile(true);
    try {
      const booksWithDescriptions = books.map(book => ({
        id: book.id,
        customDescription: book.customDescription
      }));
      await createUserListMutation.mutateAsync({
        title: listTitle || "My Reading List",
        description: undefined,
        books: booksWithDescriptions,
      });
    } catch (error) {
      console.error('Failed to save to profile:', error);
    } finally {
      setIsSavingToProfile(false);
    }
  };

  const handleViewList = async () => {
    let urlToView: string | null = null;
    
    if (sessionSlug) {
      // Use preview URL if sessionSlug is available
      urlToView = generatePreviewUrl(sessionSlug);
    } else if (shareUrl) {
      urlToView = shareUrl;
    } else {
      urlToView = await createShareUrl() || null;
    }
    
    if (urlToView) {
      const url = new URL(urlToView);
      router.push(url.pathname + url.search);
    }
  };

  // Regenerate share URL when books or title change
  useEffect(() => {
    if (canShare && shareUrl) {
      setShareUrl(null); // Clear existing share URL to force regeneration
    }
  }, [books, listTitle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <BookList
          books={books}
          maxSize={ANONYMOUS_LIST_SIZE}
          onRemoveBook={removeBook}
          onDescriptionChange={handleDescriptionChange}
          className="mb-6"
        />

        {loadingExistingBooks ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Loading existing books...
            </div>
          </div>
        ) : comparison ? (
          <BookComparison 
            comparison={comparison} 
            onChoice={handleComparisonChoice} 
          />
        ) : (
          <div className="space-y-8">

            {/* Search Section - Show when not complete or in edit mode */}
            {(!isComplete || isEditMode) && (
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
                    className="pr-10"
                  />
                  {(isSearching || isLoadingSuggestions) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-gray-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <Button onClick={handleSearch} disabled={isSearching} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <SearchResults
              results={searchResults}
              books={books}
              maxSize={ANONYMOUS_LIST_SIZE}
              onSelectBook={startComparison}
              isSuggestions={!debouncedSearchQuery.trim() && books.length > 0 && books.length < ANONYMOUS_LIST_SIZE}
              suggestionsMessage={selectedCategories.length > 0 
                ? `Suggestions based on ${selectedCategories.slice(0, 2).join(', ')}${selectedCategories.length > 2 ? ` and ${selectedCategories.length - 2} more` : ''}`
                : "Suggestions similar to selected books"}
            />
          </div>
            )}


            {/* Sharing Section - Show when we have a session slug and at least one book */}
            {sessionSlug && books.length > 0 && (
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl font-semibold mb-2 text-gray-900">
                  {basedOnExisting
                    ? "Your modified reading list"
                    : books.length === 0
                      ? "Your reading list"
                      : isComplete 
                        ? "List complete!" 
                        : "Ready to share!"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {basedOnExisting
                    ? "This is your own copy - modify it as you like. The original list remains unchanged."
                    : books.length === 0 
                      ? "Add books to create your curated reading list"
                      : !isComplete 
                        ? `You can share now or continue adding books (up to ${ANONYMOUS_LIST_SIZE} total)`
                        : "Share your complete reading list"}
                </p>
            
            <div className="space-y-4">
              {/* List Title Input */}
              <div>
                <Input
                  type="text"
                  placeholder="Give your list a title (optional)"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="text-center text-lg font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., &ldquo;Learn Machine Learning&rdquo;, &ldquo;Must reads before your MBA&rdquo;
                </p>
              </div>

              {/* Preview URL + Copy Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={sessionSlug ? generatePreviewUrl(sessionSlug) : (shareUrl || "")}
                    readOnly
                    className="bg-gray-50 pr-10"
                  />
                  {isRegeneratingSlug && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleCopyLink} 
                  variant="outline"
                  disabled={isRegeneratingSlug}
                >
                  {copied ? (
                    <span className="text-green-600 text-sm">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button 
                onClick={handleViewList} 
                className="w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View List
              </Button>

              {session && (
                <Button 
                  onClick={handleSaveToProfile}
                  disabled={isSavingToProfile}
                  className="w-full"
                  variant="outline"
                >
                  {isSavingToProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Save to My Profile
                    </>
                  )}
                </Button>
              )}

              {!session && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Want to save this list to your profile?</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/api/auth/signin">
                      Sign in to Save
                    </Link>
                  </Button>
                </div>
              )}
            </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}