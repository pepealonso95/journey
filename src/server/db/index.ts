import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';

// Combine schemas for full database access
const fullSchema = { ...schema, ...authSchema };

export const db = drizzle(sql, { schema: fullSchema });