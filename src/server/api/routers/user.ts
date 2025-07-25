import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc';

export const userRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      // TODO: Implement user profile lookup
      return null;
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Implement current user data
    return ctx.session.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement profile update
      return { success: true };
    }),
});