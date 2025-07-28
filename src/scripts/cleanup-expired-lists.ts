#!/usr/bin/env node

/**
 * Cleanup expired anonymous book lists
 * This script can be run periodically to remove expired anonymous lists
 */

import { db } from '@/server/db';
import { bookLists, bookListItems } from '@/server/db/schema';
import { and, eq, lt } from 'drizzle-orm';

async function cleanupExpiredLists() {
  console.log('Starting cleanup of expired anonymous lists...');
  
  try {
    // Find expired anonymous lists
    const expiredLists = await db
      .select({ id: bookLists.id, slug: bookLists.slug })
      .from(bookLists)
      .where(
        and(
          eq(bookLists.isAnonymous, true),
          lt(bookLists.expiresAt, new Date())
        )
      );

    if (expiredLists.length === 0) {
      console.log('No expired lists found');
      return;
    }

    console.log(`Found ${expiredLists.length} expired lists`);

    // Delete in transaction
    await db.transaction(async (tx) => {
      for (const list of expiredLists) {
        // Delete book list items first (foreign key constraint)
        await tx.delete(bookListItems).where(eq(bookListItems.bookListId, list.id));
        
        // Delete the book list
        await tx.delete(bookLists).where(eq(bookLists.id, list.id));
        
        console.log(`Deleted expired list: ${list.slug}`);
      }
    });

    console.log(`Successfully cleaned up ${expiredLists.length} expired lists`);
  } catch (error) {
    console.error('Failed to cleanup expired lists:', error);
    process.exit(1);
  }
}

async function main() {
  await cleanupExpiredLists();
  console.log('Cleanup completed');
  process.exit(0);
}

main();