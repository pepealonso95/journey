import { db } from '@/server/db';
import { books, searchCache } from '@/server/db/schema';
import { eq, sql, and, lt } from 'drizzle-orm';
import { searchBooks, getBookById, transformToDbFormat, type GoogleBook } from './google-books';

export class BookCacheService {
  private static readonly SEARCH_CACHE_HOURS = 24; // Cache search results for 24 hours
  private static readonly BOOK_CACHE_DAYS = 30; // Cache book data for 30 days before re-fetching

  /**
   * Search for books with caching
   */
  static async searchBooksWithCache(query: string, maxResults = 10): Promise<GoogleBook[]> {
    // First check if we have a cached search result
    const cachedSearch = await this.getCachedSearch(query);
    
    if (cachedSearch) {
      // Get the books from cache
      const bookIds = JSON.parse(cachedSearch.results) as string[];
      const cachedBooks = await this.getBooksFromCache(bookIds.slice(0, maxResults));
      
      if (cachedBooks.length > 0) {
        return cachedBooks;
      }
    }

    // No cache or cache miss, fetch from API
    const apiResults = await searchBooks(query, maxResults);
    
    if (apiResults.length > 0) {
      // Cache the search results
      await this.cacheSearchResults(query, apiResults);
      
      // Cache individual books
      await this.cacheBooks(apiResults);
    }

    return apiResults;
  }

  /**
   * Get a book by ID with caching
   */
  static async getBookByIdWithCache(id: string): Promise<GoogleBook | null> {
    // First check our cache
    const cachedBook = await this.getBookFromCache(id);
    
    if (cachedBook) {
      // Update access tracking
      await this.updateBookAccess(id);
      return cachedBook;
    }

    // Not in cache, fetch from API
    const apiBook = await getBookById(id);
    
    if (apiBook) {
      // Cache the book
      await this.cacheBooks([apiBook]);
    }

    return apiBook;
  }

  /**
   * Get multiple books by IDs with caching
   */
  static async getBooksByIdsWithCache(ids: string[]): Promise<GoogleBook[]> {
    const results: GoogleBook[] = [];
    const uncachedIds: string[] = [];

    // Check cache for each book
    for (const id of ids) {
      const cachedBook = await this.getBookFromCache(id);
      if (cachedBook) {
        results.push(cachedBook);
        await this.updateBookAccess(id);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached books from API
    if (uncachedIds.length > 0) {
      const apiBooks = await Promise.all(
        uncachedIds.map(async (id) => {
          try {
            return await getBookById(id);
          } catch (error) {
            console.error(`Failed to fetch book ${id}:`, error);
            return null;
          }
        })
      );

      const validApiBooks = apiBooks.filter(book => book !== null) as GoogleBook[];
      
      if (validApiBooks.length > 0) {
        await this.cacheBooks(validApiBooks);
        results.push(...validApiBooks);
      }
    }

    return results;
  }

  /**
   * Cache search results
   */
  private static async cacheSearchResults(query: string, results: GoogleBook[]): Promise<void> {
    const bookIds = results.map(book => book.id);
    const expiresAt = new Date(Date.now() + this.SEARCH_CACHE_HOURS * 60 * 60 * 1000);

    try {
      // Remove any existing cache for this query
      await db.delete(searchCache).where(eq(searchCache.query, query));

      // Insert new cache entry
      await db.insert(searchCache).values({
        query,
        results: JSON.stringify(bookIds),
        resultCount: results.length,
        expiresAt,
      });
    } catch (error) {
      // Silently fail search caching if table doesn't exist yet
      console.debug('Search caching failed (likely pre-migration):', error);
    }
  }

  /**
   * Get cached search results
   */
  private static async getCachedSearch(query: string) {
    try {
      const cached = await db
        .select()
        .from(searchCache)
        .where(
          and(
            eq(searchCache.query, query),
            sql`${searchCache.expiresAt} > NOW()`
          )
        )
        .limit(1);

      return cached[0] || null;
    } catch (error) {
      // Return null if search cache table doesn't exist yet
      console.debug('Search cache lookup failed (likely pre-migration):', error);
      return null;
    }
  }

  /**
   * Cache individual books
   */
  private static async cacheBooks(googleBooks: GoogleBook[]): Promise<void> {
    try {
      for (const googleBook of googleBooks) {
        const dbFormat = transformToDbFormat(googleBook);
        
        // Use INSERT ON CONFLICT to update if exists
        // Handle both pre and post-migration scenarios
        try {
          await db
            .insert(books)
            .values({
              ...dbFormat,
              lastAccessed: new Date(),
              accessCount: 1,
            })
            .onConflictDoUpdate({
              target: books.id,
              set: {
                title: dbFormat.title,
                authors: dbFormat.authors,
                description: dbFormat.description,
                publishedDate: dbFormat.publishedDate,
                thumbnail: dbFormat.thumbnail,
                smallThumbnail: dbFormat.smallThumbnail,
                medium: dbFormat.medium,
                large: dbFormat.large,
                extraLarge: dbFormat.extraLarge,
                isbn10: dbFormat.isbn10,
                isbn13: dbFormat.isbn13,
                pageCount: dbFormat.pageCount,
                categories: dbFormat.categories,
                language: dbFormat.language,
                previewLink: dbFormat.previewLink,
                infoLink: dbFormat.infoLink,
                canonicalVolumeLink: dbFormat.canonicalVolumeLink,
                lastAccessed: new Date(),
                accessCount: sql`COALESCE(${books.accessCount}, 0) + 1`,
              },
            });
        } catch {
          // If the new columns don't exist yet, try without them
          await db
            .insert(books)
            .values(dbFormat)
            .onConflictDoUpdate({
              target: books.id,
              set: {
                title: dbFormat.title,
                authors: dbFormat.authors,
                description: dbFormat.description,
                publishedDate: dbFormat.publishedDate,
                thumbnail: dbFormat.thumbnail,
                smallThumbnail: dbFormat.smallThumbnail,
                medium: dbFormat.medium,
                large: dbFormat.large,
                extraLarge: dbFormat.extraLarge,
                isbn10: dbFormat.isbn10,
                isbn13: dbFormat.isbn13,
                pageCount: dbFormat.pageCount,
                categories: dbFormat.categories,
                language: dbFormat.language,
                previewLink: dbFormat.previewLink,
                infoLink: dbFormat.infoLink,
                canonicalVolumeLink: dbFormat.canonicalVolumeLink,
              },
            });
        }
      }
    } catch (error) {
      console.error('Failed to cache books:', error);
    }
  }

  /**
   * Get a single book from cache
   */
  private static async getBookFromCache(id: string): Promise<GoogleBook | null> {
    try {
      const cached = await db
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      if (!cached[0]) {
        return null;
      }

      const book = cached[0];
      
      // Check if the cached book is too old (optional refresh logic)
      // Handle case where lastAccessed might not exist yet (before migration)
      const daysSinceLastAccess = book.lastAccessed 
        ? Math.floor((Date.now() - book.lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
        : 0; // Treat missing lastAccessed as fresh

      if (daysSinceLastAccess > this.BOOK_CACHE_DAYS) {
        // Book cache is old, return null to trigger fresh fetch
        return null;
      }

      // Transform back to GoogleBook format
      return {
        id: book.id,
        volumeInfo: {
          title: book.title,
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
      };
    } catch (error) {
      console.error('Failed to get book from cache:', error);
      return null;
    }
  }

  /**
   * Get multiple books from cache
   */
  private static async getBooksFromCache(ids: string[]): Promise<GoogleBook[]> {
    const books = await Promise.all(
      ids.map(id => this.getBookFromCache(id))
    );
    
    return books.filter(book => book !== null) as GoogleBook[];
  }

  /**
   * Update book access tracking
   */
  private static async updateBookAccess(id: string): Promise<void> {
    try {
      // Skip access tracking if the migration hasn't been run yet
      // This prevents errors when the new columns don't exist
      await db
        .update(books)
        .set({
          lastAccessed: new Date(),
          accessCount: sql`COALESCE(${books.accessCount}, 0) + 1`,
        })
        .where(eq(books.id, id));
    } catch (error) {
      // Silently fail access tracking if columns don't exist yet
      // This allows the app to work before migration is applied
      console.debug('Access tracking failed (likely pre-migration):', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    try {
      // Remove expired search cache entries
      await db.delete(searchCache).where(lt(searchCache.expiresAt, new Date()));
      
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    try {
      const [searchCacheCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(searchCache);

      const [bookCacheCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(books);

      return {
        searchCacheEntries: searchCacheCount?.count || 0,
        cachedBooks: bookCacheCount?.count || 0,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        searchCacheEntries: 0,
        cachedBooks: 0,
      };
    }
  }
}