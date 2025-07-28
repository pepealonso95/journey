import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from '@/server/db/schema';

// Database connection for edge runtime (without auth dependencies)
export const dbEdge = drizzle(sql, { schema });