import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc';
import { db } from '@/server/db';
import { bookLists, bookListItems, books, users } from '@/server/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { BookCacheService } from '@/lib/book-cache';
import { transformToDbFormat } from '@/lib/google-books';
import { createId } from '@paralleldrive/cuid2';

export const bookListRouter = createTRPCRouter({
  createAnonymous: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        bookIds: z.array(z.string()).min(1).max(4).optional(), // For backward compatibility
        books: z.array(z.object({
          id: z.string(),
          customDescription: z.string().max(300).optional(),
        })).min(1).max(4).optional(), // New format with descriptions
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { title, description, bookIds, books: inputBooks, slug: providedSlug } = input;
      
      // Handle both old and new input formats
      const rawBookData = inputBooks || (bookIds ? bookIds.map(id => ({ id, customDescription: undefined })) : []);
      if (!rawBookData || rawBookData.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No books provided' });
      }
      
      // Filter out any empty book IDs and validate
      const bookData = rawBookData.filter(book => {
        if (!book.id || book.id.trim() === '') {
          console.warn('Filtering out book with empty ID:', book);
          return false;
        }
        return true;
      });
      
      if (bookData.length === 0) {
        console.error('No valid books after filtering. Original data:', rawBookData);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No valid books provided' });
      }
      
      console.log('Processing books:', bookData.map(b => ({ id: b.id, hasDescription: !!b.customDescription })));
      
      // Use provided slug or generate a URL-friendly slug
      let slug: string;
      if (providedSlug) {
        slug = providedSlug;
      } else {
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        slug = `${baseSlug}-${createId().toLowerCase()}`;
      }
      
      // Set expiration for 90 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      try {
        // Fetch and cache the books first (outside transaction)
        const bookIdsToFetch = bookData.map(b => b.id);
        console.log('Fetching books from cache:', bookIdsToFetch);
        
        const googleBooks = await BookCacheService.getBooksByIdsWithCache(bookIdsToFetch);
        console.log('Retrieved books from cache:', googleBooks.length, 'out of', bookIdsToFetch.length);
        
        // Filter out any null/undefined books
        const validGoogleBooks = googleBooks.filter(book => book && book.id);
        if (validGoogleBooks.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No valid books could be retrieved' });
        }
        
        // Start a transaction to create the list and add books
        const result = await db.transaction(async (tx) => {
          // First, ensure all books exist in our database
          for (const googleBook of validGoogleBooks) {
            try {
              const bookDataToInsert = transformToDbFormat(googleBook);
              await tx.insert(books).values(bookDataToInsert).onConflictDoNothing();
            } catch (error) {
              console.error('Failed to transform book data:', error, googleBook);
              // Skip invalid books rather than failing the entire operation
              continue;
            }
          }
          
          // Create the anonymous book list
          const [newList] = await tx.insert(bookLists).values({
            title,
            description,
            userId: null, // Anonymous list
            isPublic: true,
            isAnonymous: true,
            slug,
            expiresAt,
          }).returning();

          if (!newList) {
            throw new Error('Failed to create book list');
          }

          // Add books to the list in order (sequentially to avoid race conditions)
          for (let index = 0; index < bookData.length; index++) {
            await tx.insert(bookListItems).values({
              bookListId: newList.id,
              bookId: bookData[index].id,
              sortOrder: index,
              customDescription: bookData[index].customDescription,
            });
          }

          return newList;
        });

        return {
          success: true,
          list: result,
          shareUrl: `/share/${slug}`,
        };
      } catch (error) {
        console.error('Failed to create anonymous book list:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to create book list' 
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      const [newList] = await db.insert(bookLists).values({
        title: input.title,
        description: input.description,
        userId: ctx.session.user.id,
        slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
      }).returning();

      return newList;
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const userLists = await db
      .select({
        id: bookLists.id,
        title: bookLists.title,
        description: bookLists.description,
        slug: bookLists.slug,
        isPublic: bookLists.isPublic,
        createdAt: bookLists.createdAt,
        updatedAt: bookLists.updatedAt,
      })
      .from(bookLists)
      .where(eq(bookLists.userId, ctx.session.user.id))
      .orderBy(desc(bookLists.updatedAt));

    return userLists;
  }),

  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const bookList = await db
        .select({
          id: bookLists.id,
          title: bookLists.title,
          description: bookLists.description,
          slug: bookLists.slug,
          createdAt: bookLists.createdAt,
          userId: bookLists.userId,
          isAnonymous: bookLists.isAnonymous,
          expiresAt: bookLists.expiresAt,
          userName: users.name,
          userImage: users.image,
          userTwitterHandle: users.twitterHandle,
          userTwitterProfileUrl: users.twitterProfileUrl,
        })
        .from(bookLists)
        .leftJoin(users, eq(bookLists.userId, users.id))
        .where(
          and(
            eq(bookLists.slug, input.slug),
            eq(bookLists.isPublic, true)
          )
        );

      if (!bookList.length) {
        return null;
      }

      const list = bookList[0]!;

      // Check if anonymous list has expired
      if (list.isAnonymous && list.expiresAt && list.expiresAt < new Date()) {
        return null;
      }

      // Get books in the list
      const listBooks = await db
        .select({
          book: books,
          sortOrder: bookListItems.sortOrder,
          customDescription: bookListItems.customDescription,
        })
        .from(bookListItems)
        .leftJoin(books, eq(bookListItems.bookId, books.id))
        .where(eq(bookListItems.bookListId, list.id))
        .orderBy(bookListItems.sortOrder);

      return {
        ...list,
        books: listBooks.map(item => ({
          ...item.book,
          sortOrder: item.sortOrder,
          customDescription: item.customDescription,
        })).filter(book => book.id), // Filter out null books
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async () => {
      // TODO: Implement database update
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        // First, verify the user owns this list
        const listToDelete = await db
          .select({ userId: bookLists.userId })
          .from(bookLists)
          .where(eq(bookLists.id, input.id))
          .limit(1);

        if (!listToDelete.length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found' });
        }

        if (listToDelete[0].userId !== ctx.session.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own lists' });
        }

        // Delete the list (cascade delete will handle related records)
        await db.delete(bookLists).where(eq(bookLists.id, input.id));

        return { success: true };
      } catch (error) {
        console.error('Failed to delete list:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to delete list' 
        });
      }
    }),

  cleanupUnusedSlugs: publicProcedure
    .input(z.object({ 
      slugs: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/)).min(1).max(50) // Only allow safe slug characters, limit count
    }))
    .mutation(async ({ input }) => {
      try {
        const { slugs } = input;
        
        // Delete anonymous book lists that have the specified slugs
        // Only delete if they are anonymous and haven't been accessed recently
        const deletedLists = await db
          .delete(bookLists)
          .where(
            and(
              // Use Drizzle's inArray helper for safe parameter binding
              sql`${bookLists.slug} = ANY(${slugs})`,
              eq(bookLists.isAnonymous, true),
              // Only delete if created recently (within last hour) to avoid deleting lists that might be in use
              sql`${bookLists.createdAt} > NOW() - INTERVAL '1 hour'`
            )
          )
          .returning({ slug: bookLists.slug });
        
        console.log('Cleaned up unused slugs:', deletedLists.map(l => l.slug));
        
        return { 
          success: true, 
          cleanedSlugs: deletedLists.map(l => l.slug),
          message: `Cleaned up ${deletedLists.length} unused slugs`
        };
      } catch (error) {
        console.error('Failed to cleanup unused slugs:', error);
        return { 
          success: false, 
          cleanedSlugs: [],
          message: 'Failed to cleanup slugs'
        };
      }
    }),

  createOwned: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        books: z.array(z.object({
          id: z.string(),
          customDescription: z.string().max(300).optional(),
        })).min(1).max(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { title, description, books: inputBooks } = input;
      
      // Get the user's Twitter handle for slug generation
      const user = await db.select({ twitterHandle: users.twitterHandle })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
      if (!user.length || !user[0].twitterHandle) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User must have a Twitter handle' });
      }
      
      // Generate URL-friendly slug for the user
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      const slug = `${baseSlug}-${createId().toLowerCase()}`;

      try {
        // Fetch and cache the books first
        const bookIdsToFetch = inputBooks.map(b => b.id);
        const googleBooks = await BookCacheService.getBooksByIdsWithCache(bookIdsToFetch);
        const validGoogleBooks = googleBooks.filter(book => book && book.id);
        
        if (validGoogleBooks.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No valid books could be retrieved' });
        }

        const result = await db.transaction(async (tx) => {
          // Ensure all books exist in database
          for (const googleBook of validGoogleBooks) {
            try {
              const bookDataToInsert = transformToDbFormat(googleBook);
              await tx.insert(books).values(bookDataToInsert).onConflictDoNothing();
            } catch (error) {
              console.error('Failed to transform book data:', error, googleBook);
              continue;
            }
          }
          
          // Create the owned book list
          const [newList] = await tx.insert(bookLists).values({
            title,
            description,
            userId,
            isPublic: true,
            isAnonymous: false,
            slug,
          }).returning();

          if (!newList) {
            throw new Error('Failed to create book list');
          }

          // Add books to the list
          for (let index = 0; index < inputBooks.length; index++) {
            await tx.insert(bookListItems).values({
              bookListId: newList.id,
              bookId: inputBooks[index].id,
              sortOrder: index,
              customDescription: inputBooks[index].customDescription,
            });
          }

          return newList;
        });

        return {
          success: true,
          list: result,
          shareUrl: `/profile/${user[0].twitterHandle}/${slug}`,
        };
      } catch (error) {
        console.error('Failed to create owned book list:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to create book list' 
        });
      }
    }),

  getMostLiked: publicProcedure
    .input(z.object({
      timeframe: z.enum(['week', 'month', 'all']).default('week'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const { timeframe, limit } = input;
      
      let dateFilter = sql`true`;
      if (timeframe === 'week') {
        dateFilter = gte(bookLists.createdAt, sql`NOW() - INTERVAL '7 days'`);
      } else if (timeframe === 'month') {
        dateFilter = gte(bookLists.createdAt, sql`NOW() - INTERVAL '30 days'`);
      }

      const popularLists = await db
        .select({
          id: bookLists.id,
          title: bookLists.title,
          description: bookLists.description,
          slug: bookLists.slug,
          likeCount: bookLists.likeCount,
          createdAt: bookLists.createdAt,
          user: {
            name: users.name,
            twitterHandle: users.twitterHandle,
            image: users.image,
          },
        })
        .from(bookLists)
        .leftJoin(users, eq(bookLists.userId, users.id))
        .where(and(
          eq(bookLists.isPublic, true),
          eq(bookLists.isAnonymous, false), // Only show owned lists
          dateFilter
        ))
        .orderBy(desc(bookLists.likeCount), desc(bookLists.createdAt))
        .limit(limit);

      // Get preview books for each list
      const listsWithBooks = await Promise.all(
        popularLists.map(async (list) => {
          const listBooks = await db
            .select({
              book: books,
              sortOrder: bookListItems.sortOrder,
            })
            .from(bookListItems)
            .leftJoin(books, eq(bookListItems.bookId, books.id))
            .where(eq(bookListItems.bookListId, list.id))
            .orderBy(bookListItems.sortOrder)
            .limit(4);

          return {
            ...list,
            books: listBooks.map(item => item.book).filter(Boolean),
          };
        })
      );

      return listsWithBooks;
    }),

  getByUserAndSlug: publicProcedure
    .input(z.object({ 
      twitterHandle: z.string(),
      slug: z.string() 
    }))
    .query(async ({ input }) => {
      const { twitterHandle, slug } = input;

      // First get the user
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          twitterHandle: users.twitterHandle,
          twitterProfileUrl: users.twitterProfileUrl,
          image: users.image,
        })
        .from(users)
        .where(eq(users.twitterHandle, twitterHandle))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Get the specific list
      const bookList = await db
        .select({
          id: bookLists.id,
          title: bookLists.title,
          description: bookLists.description,
          slug: bookLists.slug,
          likeCount: bookLists.likeCount,
          createdAt: bookLists.createdAt,
          userId: bookLists.userId,
        })
        .from(bookLists)
        .where(and(
          eq(bookLists.userId, user[0].id),
          eq(bookLists.slug, slug),
          eq(bookLists.isPublic, true)
        ))
        .limit(1);

      if (!bookList.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found' });
      }

      const list = bookList[0];

      // Get books in the list
      const listBooks = await db
        .select({
          book: books,
          sortOrder: bookListItems.sortOrder,
          customDescription: bookListItems.customDescription,
        })
        .from(bookListItems)
        .leftJoin(books, eq(bookListItems.bookId, books.id))
        .where(eq(bookListItems.bookListId, list.id))
        .orderBy(bookListItems.sortOrder);

      return {
        ...list,
        user: user[0],
        books: listBooks.map(item => ({
          ...item.book,
          sortOrder: item.sortOrder,
          customDescription: item.customDescription,
        })).filter(book => book.id),
      };
    }),
});