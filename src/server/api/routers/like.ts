import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import { db } from '@/server/db';
import { bookListLikes, bookLists } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const likeRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({
      bookListId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { bookListId } = input;

      // Check if the list exists
      const list = await db.select({ id: bookLists.id })
        .from(bookLists)
        .where(eq(bookLists.id, bookListId))
        .limit(1);

      if (!list.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Book list not found' });
      }

      // Check if user already liked this list
      const existingLike = await db.select({ id: bookListLikes.id })
        .from(bookListLikes)
        .where(and(
          eq(bookListLikes.userId, userId),
          eq(bookListLikes.bookListId, bookListId)
        ))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike: remove the like and decrement count
        await db.transaction(async (tx) => {
          await tx.delete(bookListLikes)
            .where(and(
              eq(bookListLikes.userId, userId),
              eq(bookListLikes.bookListId, bookListId)
            ));
          
          await tx.update(bookLists)
            .set({ 
              likeCount: sql`${bookLists.likeCount} - 1` 
            })
            .where(eq(bookLists.id, bookListId));
        });

        return { liked: false };
      } else {
        // Like: add the like and increment count
        await db.transaction(async (tx) => {
          await tx.insert(bookListLikes)
            .values({
              userId,
              bookListId,
            });
          
          await tx.update(bookLists)
            .set({ 
              likeCount: sql`${bookLists.likeCount} + 1` 
            })
            .where(eq(bookLists.id, bookListId));
        });

        return { liked: true };
      }
    }),

  isLiked: protectedProcedure
    .input(z.object({
      bookListId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { bookListId } = input;

      const like = await db.select({ id: bookListLikes.id })
        .from(bookListLikes)
        .where(and(
          eq(bookListLikes.userId, userId),
          eq(bookListLikes.bookListId, bookListId)
        ))
        .limit(1);

      return like.length > 0;
    }),

  getLikedByUser: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const likedLists = await db
        .select({
          bookList: bookLists,
          likedAt: bookListLikes.createdAt,
        })
        .from(bookListLikes)
        .innerJoin(bookLists, eq(bookListLikes.bookListId, bookLists.id))
        .where(eq(bookListLikes.userId, userId))
        .orderBy(sql`${bookListLikes.createdAt} DESC`);

      return likedLists;
    }),
});