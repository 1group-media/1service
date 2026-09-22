import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:520372e54bba9d399fca752c0deb97f7@db.aswefqrejqbhujjybgex.supabase.co:5432/postgres',
  },
});
