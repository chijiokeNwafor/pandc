import nextEnv from '@next/env';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
if (!process.env.DATABASE_URL)
  throw new Error('Set DATABASE_URL before running migrations.');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});
try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle/postgres' });
  console.log('PostgreSQL migrations applied.');
} finally {
  await pool.end();
}
