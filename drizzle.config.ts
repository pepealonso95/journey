import { type Config } from 'drizzle-kit';

export default {
  schema: ['./src/server/db/schema.ts', './src/server/db/auth-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ['journey_*'],
} satisfies Config;