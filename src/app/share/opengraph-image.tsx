import { ImageResponse } from '@vercel/og';
import { getBookById } from '@/lib/google-books';
import { parseShareUrl } from '@/lib/share-url';

export const runtime = 'edge';

export default async function Image({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  try {
    // Create URLSearchParams from the searchParams
    const urlSearchParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        urlSearchParams.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    const parseResult = parseShareUrl(urlSearchParams);
    
    if (!parseResult) {
      // Default image
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
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold' }}>Journey</div>
            <div style={{ fontSize: '24px', color: '#6b7280' }}>Share Your Reading Journey</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const { bookIds, title } = parseResult;

    // Fetch book data
    const books = await Promise.all(
      bookIds.slice(0, 4).map(async (id) => {
        try {
          const book = await getBookById(id);
          return book;
        } catch {
          return null;
        }
      })
    );

    const validBooks = books.filter(Boolean);
    const listTitle = title || 'Reading List';

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
            padding: '40px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '40px',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            {listTitle}
          </div>

          {/* Books Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              maxWidth: '600px',
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => {
              const book = validBooks[index];
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '120px',
                  }}
                >
                  {/* Book Cover */}
                  {book?.volumeInfo.imageLinks?.thumbnail ? (
                    <img
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      style={{
                        width: '120px',
                        height: '180px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        marginBottom: '12px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '120px',
                        height: '180px',
                        backgroundColor: book ? '#f3f4f6' : '#f9fafb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        border: book ? '1px solid #e5e7eb' : '2px dashed #d1d5db',
                      }}
                    >
                      <span style={{ 
                        color: '#9ca3af', 
                        fontSize: book ? '14px' : '32px',
                      }}>
                        {book ? 'No Cover' : index + 1}
                      </span>
                    </div>
                  )}

                  {/* Reading Order */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: book ? '#1f2937' : '#f3f4f6',
                      color: book ? 'white' : '#9ca3af',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Journey branding */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '24px',
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
    // Fallback image
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
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>Journey</div>
          <div style={{ fontSize: '24px', color: '#6b7280' }}>Share Your Reading Journey</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}