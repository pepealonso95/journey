import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc';
import { googleBooksService, GoogleBooksService } from '@/lib/google-books';
import { db } from '@/server/db';
import { books, bookListItems } from '@/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export const bookRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const results = await googleBooksService.searchBooks(input.query, 20);
        return results.map((book) => ({
          id: book.id,
          title: book.volumeInfo.title,
          authors: book.volumeInfo.authors || [],
          description: book.volumeInfo.description,
          publishedDate: book.volumeInfo.publishedDate,
          thumbnail: book.volumeInfo.imageLinks?.thumbnail,
          smallThumbnail: book.volumeInfo.imageLinks?.smallThumbnail,
          medium: book.volumeInfo.imageLinks?.medium,
          large: book.volumeInfo.imageLinks?.large,
          extraLarge: book.volumeInfo.imageLinks?.extraLarge,
          pageCount: book.volumeInfo.pageCount,
          categories: book.volumeInfo.categories || [],
          previewLink: book.volumeInfo.previewLink,
          infoLink: book.volumeInfo.infoLink,
        }));
      } catch (error) {
        console.error('Book search error:', error);
        return [];
      }
    }),

  addToList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookId: z.string(),
        insertIndex: z.number().min(0).max(3), // 0-3 for 4 books
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { listId, bookId, insertIndex } = input;
      
      try {
        // First, ensure the book exists in our database
        const googleBook = await googleBooksService.getBookById(bookId);
        if (!googleBook) {
          throw new Error('Book not found');
        }

        // Upsert the book into our database
        const bookData = GoogleBooksService.transformToDbFormat(googleBook);
        await db.insert(books).values(bookData).onConflictDoNothing();

        // Shift existing books at and after insertIndex
        await db.update(bookListItems)
          .set({ sortOrder: sql`sort_order + 1` })
          .where(and(
            eq(bookListItems.bookListId, parseInt(listId)),
            gte(bookListItems.sortOrder, insertIndex)
          ));

        // Add the new book at the specified index
        await db.insert(bookListItems).values({
          bookListId: parseInt(listId),
          bookId,
          sortOrder: insertIndex,
        });

        return { success: true };
      } catch (error) {
        console.error('Add book to list error:', error);
        throw new Error('Failed to add book to list');
      }
    }),

  removeFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { listId, bookId } = input;
      
      try {
        // Get the current sort order of the book being removed
        const [bookToRemove] = await db
          .select()
          .from(bookListItems)
          .where(
            and(
              eq(bookListItems.bookListId, parseInt(listId)),
              eq(bookListItems.bookId, bookId)
            )
          );

        if (!bookToRemove) {
          throw new Error('Book not found in list');
        }

        // Remove the book from the list
        await db.delete(bookListItems)
          .where(
            and(
              eq(bookListItems.bookListId, parseInt(listId)),
              eq(bookListItems.bookId, bookId)
            )
          );

        // Shift remaining books down to fill the gap
        await db.update(bookListItems)
          .set({ sortOrder: sql`sort_order - 1` })
          .where(
            and(
              eq(bookListItems.bookListId, parseInt(listId)),
              gte(bookListItems.sortOrder, bookToRemove.sortOrder)
            )
          );

        return { success: true };
      } catch (error) {
        console.error('Remove book from list error:', error);
        throw new Error('Failed to remove book from list');
      }
    }),

  reorderInList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        bookId: z.string(),
        newIndex: z.number().min(0).max(3), // 0-3 for 4 books
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { listId, bookId, newIndex } = input;
      
      try {
        // Get current position
        const [currentBook] = await db
          .select()
          .from(bookListItems)
          .where(
            and(
              eq(bookListItems.bookListId, parseInt(listId)),
              eq(bookListItems.bookId, bookId)
            )
          );

        if (!currentBook) {
          throw new Error('Book not found in list');
        }

        const oldIndex = currentBook.sortOrder;
        
        if (oldIndex === newIndex) {
          return { success: true }; // No change needed
        }

        // Update sort orders based on direction of move
        if (oldIndex < newIndex) {
          // Moving down: shift books between old and new position up
          await db.update(bookListItems)
            .set({ sortOrder: sql`sort_order - 1` })
            .where(
              and(
                eq(bookListItems.bookListId, parseInt(listId)),
                gte(bookListItems.sortOrder, oldIndex + 1),
                sql`sort_order <= ${newIndex}`
              )
            );
        } else {
          // Moving up: shift books between new and old position down
          await db.update(bookListItems)
            .set({ sortOrder: sql`sort_order + 1` })
            .where(
              and(
                eq(bookListItems.bookListId, parseInt(listId)),
                gte(bookListItems.sortOrder, newIndex),
                sql`sort_order < ${oldIndex}`
              )
            );
        }

        // Update the moved book to its new position
        await db.update(bookListItems)
          .set({ sortOrder: newIndex })
          .where(
            and(
              eq(bookListItems.bookListId, parseInt(listId)),
              eq(bookListItems.bookId, bookId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error('Reorder book in list error:', error);
        throw new Error('Failed to reorder book in list');
      }
    }),
});