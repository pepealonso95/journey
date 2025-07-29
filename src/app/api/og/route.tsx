import { ImageResponse } from '@vercel/og';
import { sql } from '@vercel/postgres';

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}

export const runtime = 'edge';

// Security helper functions
function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  // Remove HTML tags and limit length
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, '') // Remove potentially dangerous characters
    .substring(0, 200) // Limit length
    .trim();
}

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Only allow HTTPS URLs from trusted domains
    return parsed.protocol === 'https:' && 
           (parsed.hostname.includes('googleusercontent.com') || 
            parsed.hostname.includes('googleapis.com') ||
            parsed.hostname.includes('books.google.com'));
  } catch {
    return false;
  }
}

function isValidSlug(slug: string | null): boolean {
  if (!slug) return false;
  // Only allow alphanumeric, hyphens, and underscores, 3-100 chars
  return /^[a-zA-Z0-9_-]{3,100}$/.test(slug);
}

export async function GET(request: Request) {
  console.log('OG: Starting function');
  
  try {
    const url = new URL(request.url);
    console.log('OG: Route called with URL:', url.href);
    
    const { searchParams } = url;
    const rawSlug = searchParams.get('slug');
    const rawHandle = searchParams.get('handle');
    const rawBookIds = searchParams.get('books')?.split(',') || [];
    const rawTitle = searchParams.get('title') || 'Reading List';

    // Validate and sanitize inputs
    const slug = rawSlug && isValidSlug(rawSlug) ? rawSlug : null;
    const handle = rawHandle && /^[a-zA-Z0-9_]{1,15}$/.test(rawHandle) ? rawHandle : null;
    const bookIds = rawBookIds.filter(id => /^[a-zA-Z0-9_-]{1,50}$/.test(id)).slice(0, 4); // Limit to 4 books
    const finalTitle = sanitizeText(rawTitle) || 'Reading List';

    console.log('OG: Parameters - slug:', slug, 'handle:', handle, 'bookIds:', bookIds, 'title:', finalTitle);

    // Test basic database connectivity first
    try {
      console.log('OG: Testing database connection...');
      const testResult = await sql`SELECT 1 as test`;
      console.log('OG: Database test result:', testResult.rows);
    } catch (dbError) {
      console.error('OG: Database connection failed:', dbError);
      return new Response('Database connection failed', { status: 500 });
    }

    let finalBookIds = bookIds;
    let finalTitle2 = finalTitle;

    // If slug is provided, fetch from database directly
    if (slug) {
      try {
        console.log('OG: Fetching book list for slug:', slug);
        
        // First, let's see what slugs actually exist
        const allSlugs = await sql`SELECT slug FROM "journey_bookList" LIMIT 10`;
        console.log('OG: Available slugs:', allSlugs.rows.map((r) => (r as { slug: string }).slug));
        
        // Get book list info - handle both regular and profile-based queries
        let listResult;
        if (handle) {
          // Profile-based query: join with users table to match by handle and slug
          listResult = await sql`
            SELECT bl.id, bl.title, bl."isAnonymous", bl.expires_at
            FROM "journey_bookList" bl
            JOIN "journey_user" u ON bl."userId" = u.id
            WHERE u."twitterHandle" = ${handle} AND bl.slug = ${slug}
            LIMIT 1
          `;
        } else {
          // Regular share query: match by slug only
          listResult = await sql`
            SELECT id, title, "isAnonymous", expires_at
            FROM "journey_bookList"
            WHERE slug = ${slug}
            LIMIT 1
          `;
        }
        
        console.log('OG: List query result:', listResult.rows.length, 'rows');
        if (listResult.rows.length > 0) {
          console.log('OG: Found list:', listResult.rows[0]);
        }
        
        if (listResult.rows.length > 0) {
          const list = listResult.rows[0] as {
            id: number;
            title: string;
            isAnonymous: boolean;
            expires_at: string | null;
          };
          
          // Check if anonymous list has expired
          if (list.isAnonymous && list.expires_at && new Date(list.expires_at) < new Date()) {
            console.log('OG: Anonymous list has expired');
            // Use fallback values
          } else {
            // Get books in the list
            const booksResult = await sql`
              SELECT "bookId", "sortOrder"
              FROM "journey_bookListItem"
              WHERE "bookListId" = ${list.id}
              ORDER BY "sortOrder"
            `;
            
            finalBookIds = booksResult.rows.map((item) => (item as { bookId: string }).bookId);
            finalTitle2 = sanitizeText(list.title) || 'Reading List';
            
            console.log('OG: Found book list with', finalBookIds.length, 'books');
          }
        }
      } catch (error) {
        console.error('OG: Failed to fetch book list:', error);
        // Fallback to provided bookIds and title
      }
    }

    if (finalBookIds.length === 0) {
      console.log('OG: No book IDs found - slug:', slug, 'bookIds:', bookIds);
      return new Response(`Missing book IDs - slug: ${slug}, provided bookIds: ${bookIds.join(',')}`, { status: 400 });
    }

    // Fetch book data from database
    let validBooks: GoogleBook[] = [];
    
    try {
      console.log('OG: Attempting to fetch books from DB:', finalBookIds.slice(0, 4));
      
      // Fetch books individually to avoid array parameter issues
      const bookPromises = finalBookIds.slice(0, 4).map(async (bookId) => {
        try {
          const result = await sql`
            SELECT id, title, thumbnail, "smallThumbnail", medium, large, "extraLarge", authors, description, "publishedDate", isbn10, isbn13, "pageCount", categories, language, "previewLink", "infoLink", "canonicalVolumeLink"
            FROM "journey_book"
            WHERE id = ${bookId}
            LIMIT 1
          `;
          return result.rows[0] || null;
        } catch (err) {
          console.error(`OG: Failed to fetch book ${bookId}:`, err);
          return null;
        }
      });
      
      const bookResults = await Promise.all(bookPromises);
      const books = bookResults.filter(book => book !== null);
      
      console.log('OG: Database result:', books.length, 'books found');
      
      validBooks = books.map((book) => {
        console.log('OG: Processing book:', book.id, 'thumbnail:', book.thumbnail, 'medium:', book.medium, 'large:', book.large);
        return {
        id: book.id,
        volumeInfo: {
          title: sanitizeText(book.title) || 'Unknown Title',
          authors: book.authors ? JSON.parse(book.authors) : undefined,
          description: book.description || undefined,
          publishedDate: book.publishedDate || undefined,
          imageLinks: {
            thumbnail: isValidImageUrl(book.thumbnail) ? book.thumbnail : undefined,
            smallThumbnail: isValidImageUrl(book.smallThumbnail) ? book.smallThumbnail : undefined,
            medium: isValidImageUrl(book.medium) ? book.medium : undefined,
            large: isValidImageUrl(book.large) ? book.large : undefined,
            extraLarge: isValidImageUrl(book.extraLarge) ? book.extraLarge : undefined,
          },
          industryIdentifiers: [
            ...(book.isbn10 ? [{ type: 'ISBN_10' as const, identifier: book.isbn10 }] : []),
            ...(book.isbn13 ? [{ type: 'ISBN_13' as const, identifier: book.isbn13 }] : []),
          ],
          pageCount: book.pageCount || undefined,
          categories: book.categories ? JSON.parse(book.categories) : undefined,
          language: book.language || undefined,
          previewLink: book.previewLink || undefined,
          infoLink: book.infoLink || undefined,
          canonicalVolumeLink: book.canonicalVolumeLink || undefined,
        },
        };
      });
      
      console.log('OG: Transformed books:', validBooks.length);
      
    } catch (error) {
      console.error('OG: Database error:', error);
      return new Response('Failed to fetch book data', { status: 500 });
    }
    
    // If no books found, return error
    if (validBooks.length === 0) {
      console.log('OG: No books found in database');
      return new Response('No books found', { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '20px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '20px',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            {finalTitle2}
          </div>

          {/* Books Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              width: '100%',
              maxWidth: '900px',
            }}
          >
            {validBooks.map((book, index) => (
              <div
                key={book?.id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '180px',
                }}
              >
                {/* Book Cover */}
                {(() => {
                  // Try multiple image sizes in order of preference
                  const imageUrl = book?.volumeInfo.imageLinks?.large ||
                                   book?.volumeInfo.imageLinks?.medium ||
                                   book?.volumeInfo.imageLinks?.thumbnail ||
                                   book?.volumeInfo.imageLinks?.smallThumbnail;
                  
                  return imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={book.volumeInfo.title}
                      style={{
                        width: '180px',
                        height: '270px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
                        marginBottom: '16px',
                      }}
                    />
                  ) : (
                  <div
                    style={{
                      width: '180px',
                      height: '270px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>
                      No Cover
                    </span>
                  </div>
                  );
                })()}

                {/* Reading Order */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - validBooks.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '180px',
                }}
              >
                <div
                  style={{
                    width: '160px',
                    height: '240px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '2px dashed #d1d5db',
                  }}
                >
                  <span style={{ color: '#9ca3af', fontSize: '48px' }}>
                    {validBooks.length + index + 1}
                  </span>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  {validBooks.length + index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Journey branding */}
          <div
            style={{
              marginTop: '15px',
              fontSize: '18px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>📚</span>
            Journey
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG: Top-level error generating image:', error);
    console.error('OG: Error details:', JSON.stringify(error, null, 2));
    
    // Return a simple error image instead of failing completely
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            fontSize: '24px',
            color: '#ef4444',
          }}
        >
          <div>Error generating image</div>
          <div style={{ fontSize: '16px', marginTop: '10px' }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}