import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getBookById, GoogleBook } from '@/lib/google-books';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookIds = searchParams.get('books')?.split(',') || [];
    const title = searchParams.get('title') || 'Reading List';

    if (bookIds.length === 0) {
      return new Response('Missing book IDs', { status: 400 });
    }

    // Fetch book data from Google Books API
    let validBooks: GoogleBook[] = [];
    
    try {
      const fetchedBooks = await Promise.all(
        bookIds.map(async (id) => {
          try {
            const book = await getBookById(id);
            return book;
          } catch (error) {
            console.error(`Failed to fetch book ${id}:`, error);
            return null;
          }
        })
      );
      
      validBooks = fetchedBooks.filter(book => book !== null) as GoogleBook[];
      
      // If API calls failed, create books with direct Google Books image URLs
      if (validBooks.length === 0) {
        validBooks = bookIds.slice(0, 4).map((id, index) => ({
          id,
          volumeInfo: {
            title: `Book ${index + 1}`,
            imageLinks: {
              thumbnail: `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching books for OG image:', error);
      // Fallback: create books with direct image URLs if everything fails
      validBooks = bookIds.slice(0, 4).map((id, index) => ({
        id,
        volumeInfo: {
          title: `Book ${index + 1}`,
          imageLinks: {
            thumbnail: `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`
          }
        }
      }));
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
            {title}
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
                {book?.volumeInfo.imageLinks?.thumbnail ? (
                  <img
                    src={book.volumeInfo.imageLinks.thumbnail}
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
                )}

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
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}