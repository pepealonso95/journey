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

export class GoogleBooksService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY || '';
  }

  async searchBooks(query: string, maxResults = 10): Promise<GoogleBook[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('key', this.apiKey);

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

  async getBookById(id: string): Promise<GoogleBook | null> {
    const url = `${this.baseUrl}/${id}?key=${this.apiKey}`;

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Google Books API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google Books API error:', error);
      throw new Error('Failed to get book details');
    }
  }

  /**
   * Transform Google Books data to our database format
   */
  static transformToDbFormat(googleBook: GoogleBook) {
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

// Create singleton instance
export const googleBooksService = new GoogleBooksService();