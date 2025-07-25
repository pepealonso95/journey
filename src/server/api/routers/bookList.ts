import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc';
import { db } from '@/server/db';
import { bookLists, bookListItems, books, users } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const bookListRouter = createTRPCRouter({
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
          userName: users.name,
          userImage: users.image,
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

      // Get books in the list
      const listBooks = await db
        .select({
          book: books,
          sortOrder: bookListItems.sortOrder,
        })
        .from(bookListItems)
        .leftJoin(books, eq(bookListItems.bookId, books.id))
        .where(eq(bookListItems.bookListId, bookList[0]!.id))
        .orderBy(bookListItems.sortOrder);

      return {
        ...bookList[0],
        books: listBooks.map(item => ({
          ...item.book,
          sortOrder: item.sortOrder,
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
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement database update
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement database deletion
      return { success: true };
    }),
});