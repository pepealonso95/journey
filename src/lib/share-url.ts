/**
 * URL encoding/decoding for anonymous book lists
 * Format: /share?b=bookId1,bookId2,bookId3,bookId4
 */

export const ANONYMOUS_LIST_SIZE = 4;

export interface AnonymousBookList {
  bookIds: string[];
}

/**
 * Encode book IDs into a URL-safe string
 */
export function encodeBookList(bookIds: string[]): string {
  if (bookIds.length === 0) {
    throw new Error('Book list cannot be empty');
  }
  
  if (bookIds.length > ANONYMOUS_LIST_SIZE) {
    throw new Error(`Book list cannot contain more than ${ANONYMOUS_LIST_SIZE} books`);
  }
  
  // Simple comma-separated format for readability
  return bookIds.join(',');
}

/**
 * Decode URL parameter back to book IDs
 */
export function decodeBookList(encoded: string): string[] {
  const bookIds = encoded.split(',').filter(Boolean);
  
  if (bookIds.length === 0) {
    throw new Error('Invalid book list: cannot be empty');
  }
  
  if (bookIds.length > ANONYMOUS_LIST_SIZE) {
    throw new Error(`Invalid book list: cannot contain more than ${ANONYMOUS_LIST_SIZE} books, got ${bookIds.length}`);
  }
  
  return bookIds;
}

/**
 * Generate a shareable URL for an anonymous book list
 */
export function generateShareUrl(bookIds: string[], title?: string, baseUrl?: string): string {
  const encoded = encodeBookList(bookIds);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL(`${base}/share`);
  url.searchParams.set('b', encoded);
  if (title?.trim()) {
    url.searchParams.set('t', encodeURIComponent(title.trim()));
  }
  return url.toString();
}

/**
 * Parse book IDs and title from URL search params
 */
export function parseShareUrl(searchParams: URLSearchParams): { bookIds: string[]; title?: string } | null {
  const encoded = searchParams.get('b');
  if (!encoded) return null;
  
  try {
    const bookIds = decodeBookList(encoded);
    const title = searchParams.get('t') ? decodeURIComponent(searchParams.get('t')!) : undefined;
    return { bookIds, title };
  } catch {
    return null;
  }
}