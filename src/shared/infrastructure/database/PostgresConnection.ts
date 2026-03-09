import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../../../config/index.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const sslConfig = config.database.ssl ? { rejectUnauthorized: false } : false;
    // Strip sslmode from URL — pg ignores ssl option when sslmode is in the connection string
    const dbUrl = config.database.url?.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '') ?? undefined;
    const connectionConfig = dbUrl
      ? { connectionString: dbUrl, ssl: sslConfig }
      : {
          host: config.database.host,
          port: config.database.port,
          database: config.database.name,
          user: config.database.user,
          password: config.database.password,
          ssl: sslConfig,
        };

    pool = new Pool({
      ...connectionConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (config.isDev) {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }

  return result;
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
