/**
 * URL encoding/decoding for anonymous book lists
 * Format: /share?b=bookId1,bookId2,bookId3,bookId4 (legacy)
 * New format: /share/slug-abc123
 */

import { createId } from '@paralleldrive/cuid2';

export const ANONYMOUS_LIST_SIZE = 4;

export interface AnonymousBookList {
  bookIds: string[];
}

/**
 * Generate a session-based slug for sharing
 * Uses shorter IDs for titled lists, longer for untitled
 */
export function generateSessionSlug(title: string): string {
  const trimmedTitle = title.trim();
  
  let baseSlug: string;
  let idLength: number;
  
  if (trimmedTitle) {
    // For titled lists: use title + short ID
    baseSlug = trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length
    
    idLength = 8; // Longer ID for meaningful titles (was 6)
  } else {
    // For untitled lists: completely random slug  
    baseSlug = 'list';
    idLength = 20; // Much longer random ID for untitled lists (was 16)
  }
  
  const id = createId().toLowerCase().substring(0, idLength);
  return `${baseSlug}-${id}`;
}

/**
 * Generate preview URL from slug
 */
export function generatePreviewUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${slug}`;
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