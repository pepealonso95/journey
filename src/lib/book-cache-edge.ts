import { dbEdge } from '@/lib/db-edge';
import { books } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getBookById, type GoogleBook } from './google-books';

export class BookCacheServiceEdge {
  /**
   * Get multiple books by IDs with caching (edge-compatible)
   */
  static async getBooksByIdsWithCache(ids: string[]): Promise<GoogleBook[]> {
    const results: GoogleBook[] = [];
    const uncachedIds: string[] = [];

    // Check cache for each book
    for (const id of ids) {
      const cachedBook = await this.getBookFromCache(id);
      if (cachedBook) {
        results.push(cachedBook);
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
        // Cache books if possible (may fail in edge runtime)
        try {
          await this.cacheBooks(validApiBooks);
        } catch (error) {
          console.warn('Failed to cache books in edge runtime:', error);
        }
        results.push(...validApiBooks);
      }
    }

    return results;
  }

  /**
   * Get a single book from cache
   */
  private static async getBookFromCache(id: string): Promise<GoogleBook | null> {
    try {
      const cached = await dbEdge
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      if (!cached[0]) {
        return null;
      }

      const book = cached[0];

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
   * Cache individual books (simplified for edge runtime)
   */
  private static async cacheBooks(googleBooks: GoogleBook[]): Promise<void> {
    try {
      for (const googleBook of googleBooks) {
        const dbFormat = this.transformToDbFormat(googleBook);
        
        await dbEdge
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
    } catch (error) {
      console.error('Failed to cache books:', error);
    }
  }

  /**
   * Transform Google Books data to our database format
   */
  private static transformToDbFormat(googleBook: GoogleBook) {
    const { id, volumeInfo } = googleBook;
    const imageLinks = volumeInfo.imageLinks || {};
    
    // Extract ISBN identifiers
    const isbn10 = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === 'ISBN_10'
    )?.identifier;
    const isbn13 = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === 'ISBN_13'
    )?.identifier;

    return {
      id,
      title: volumeInfo.title,
      authors: JSON.stringify(volumeInfo.authors || []),
      description: volumeInfo.description,
      publishedDate: volumeInfo.publishedDate,
      thumbnail: imageLinks.thumbnail,
      smallThumbnail: imageLinks.smallThumbnail,
      medium: imageLinks.medium,
      large: imageLinks.large,
      extraLarge: imageLinks.extraLarge,
      isbn10,
      isbn13,
      pageCount: volumeInfo.pageCount,
      categories: JSON.stringify(volumeInfo.categories || []),
      language: volumeInfo.language,
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      canonicalVolumeLink: volumeInfo.canonicalVolumeLink,
    };
  }
}