import { createTRPCRouter } from '@/lib/trpc';
import { bookListRouter } from './routers/bookList';
import { bookRouter } from './routers/book';
import { userRouter } from './routers/user';
import { likeRouter } from './routers/like';

export const appRouter = createTRPCRouter({
  bookList: bookListRouter,
  book: bookRouter,
  user: userRouter,
  like: likeRouter,
});

export type AppRouter = typeof appRouter;