export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;  
      small?: string;
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

export interface GoogleBooksResponse {
  items?: GoogleBook[];
  totalItems: number;
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

function getApiKey(): string {
  // In edge runtime, prioritize NEXT_PUBLIC_ variables as they're available at build time
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY || '';
  return apiKey;
}

export async function searchBooks(query: string, maxResults = 10): Promise<GoogleBook[]> {
  const url = new URL(BASE_URL);
  url.searchParams.append('q', query);
  url.searchParams.append('maxResults', maxResults.toString());
  url.searchParams.append('key', getApiKey());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Google Books API error:', error);
    throw new Error('Failed to search books');
  }
}

export async function getBookById(id: string): Promise<GoogleBook | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google Books API key not configured');
  }
  
  const url = `${BASE_URL}/${id}?key=${apiKey}`;

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const book = await response.json();
    return book;
  } catch (error) {
    console.error(`Google Books API error for book ${id}:`, error);
    throw error;
  }
}

/**
 * Transform Google Books data to our database format
 */
export function transformToDbFormat(googleBook: GoogleBook) {
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

// Legacy class wrapper for backward compatibility (can be removed after migration)
export class GoogleBooksService {
  constructor(_apiKey?: string) {
    // apiKey parameter kept for backward compatibility but not used
    // since helper functions use environment variables directly
  }

  async searchBooks(query: string, maxResults = 10): Promise<GoogleBook[]> {
    return searchBooks(query, maxResults);
  }

  async getBookById(id: string): Promise<GoogleBook | null> {
    return getBookById(id);
  }

  static transformToDbFormat(googleBook: GoogleBook) {
    return transformToDbFormat(googleBook);
  }
}

// Create singleton instance for backward compatibility
export const googleBooksService = new GoogleBooksService();