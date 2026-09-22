import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.aswefqrejqbhujjybgex:520372e54bba9d399fca752c0deb97f7@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

declare global {
  // eslint-disable-next-line no-var
  var __db_pool: Pool | undefined;
}

const pool =
  globalThis.__db_pool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db_pool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
