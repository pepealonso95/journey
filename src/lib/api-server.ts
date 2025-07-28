import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/lib/trpc';
import { NextRequest } from 'next/server';

/**
 * Create a server-side API caller
 */
export async function createApiCaller() {
  const ctx = await createTRPCContext({ 
    req: new NextRequest('http://localhost') // Dummy request for server-side calls
  });
  return appRouter.createCaller(ctx);
}

/**
 * Server-side API calls for use in server components and metadata generation
 */
export const api = {
  bookList: {
    getPublic: async (input: { slug: string }) => {
      const caller = await createApiCaller();
      return caller.bookList.getPublic(input);
    },
    getByUserAndSlug: async (input: { twitterHandle: string; slug: string }) => {
      const caller = await createApiCaller();
      return caller.bookList.getByUserAndSlug(input);
    }
  }
};