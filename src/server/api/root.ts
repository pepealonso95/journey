import { createTRPCRouter } from '@/lib/trpc';
import { bookListRouter } from './routers/bookList';
import { bookRouter } from './routers/book';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  bookList: bookListRouter,
  book: bookRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;