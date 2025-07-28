import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { books } from '@/server/db/schema';

// Minimal database connection for OG route (edge runtime)
export const ogDb = drizzle(sql, { schema: { books } });
export { books };