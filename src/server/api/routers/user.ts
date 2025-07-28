import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc';
import { db } from '@/server/db';
import { users, bookLists, bookListItems, books } from '@/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({ twitterHandle: z.string() }))
    .query(async ({ input }) => {
      const { twitterHandle } = input;

      const user = await db
        .select({
          id: users.id,
          name: users.name,
          bio: users.bio,
          image: users.image,
          twitterHandle: users.twitterHandle,
          twitterProfileUrl: users.twitterProfileUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.twitterHandle, twitterHandle))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Get user's public lists
      const userLists = await db
        .select({
          id: bookLists.id,
          title: bookLists.title,
          description: bookLists.description,
          slug: bookLists.slug,
          likeCount: bookLists.likeCount,
          createdAt: bookLists.createdAt,
          bookCount: sql<number>`count(${bookListItems.id})`,
        })
        .from(bookLists)
        .leftJoin(bookListItems, eq(bookLists.id, bookListItems.bookListId))
        .where(eq(bookLists.userId, user[0].id))
        .groupBy(bookLists.id)
        .orderBy(desc(bookLists.createdAt));

      return {
        ...user[0],
        lists: userLists,
      };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        bio: users.bio,
        image: users.image,
        twitterHandle: users.twitterHandle,
        twitterProfileUrl: users.twitterProfileUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0] || null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        bio: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await db
        .update(users)
        .set({
          name: input.name,
          bio: input.bio,
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  getUserLists: publicProcedure
    .input(z.object({ twitterHandle: z.string() }))
    .query(async ({ input }) => {
      const { twitterHandle } = input;

      // First get the user
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.twitterHandle, twitterHandle))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Get their public lists with books
      const userLists = await db
        .select({
          id: bookLists.id,
          title: bookLists.title,
          description: bookLists.description,
          slug: bookLists.slug,
          likeCount: bookLists.likeCount,
          createdAt: bookLists.createdAt,
        })
        .from(bookLists)
        .where(eq(bookLists.userId, user[0].id))
        .orderBy(desc(bookLists.createdAt));

      // Get first few books for each list for preview
      const listsWithBooks = await Promise.all(
        userLists.map(async (list) => {
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
});