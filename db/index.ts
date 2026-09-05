import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
let pool: Pool | undefined;
export function getClient() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
      throw new Error('Connect Neon in Vercel Storage or set DATABASE_URL.');
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', () =>
      console.error('An idle database connection was closed.'),
    );
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}
class Statement {
  constructor(
    readonly text: string,
    readonly values: (string | number | null)[] = [],
  ) {}
  bind(...values: (string | number | null)[]) {
    return new Statement(this.text, values);
  }
  async first<T>(): Promise<T | null> {
    const result = await getClient().query(this);
    return (result.rows[0] as T) ?? null;
  }
  async all<T>() {
    const result = await getClient().query(this);
    return { results: result.rows as T[] };
  }
  async run() {
    const result = await getClient().query(this);
    return { meta: { changes: result.rowCount ?? 0 } };
  }
}
export function getDb() {
  return {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      const client = await getClient().connect();
      try {
        await client.query('BEGIN');
        const results = [];
        for (const statement of statements) {
          const result = await client.query(statement);
          results.push({ meta: { changes: result.rowCount ?? 0 } });
        }
        await client.query('COMMIT');
        return results;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
