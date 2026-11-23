import { Pool, PoolClient } from 'pg';
import { config } from '../config';

export class PostgresAdapter {
  private pool: Pool | null = null;

  constructor() {
    if (!config.useMemoryDb) {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Postgres pool not initialized');
    }
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    return { rows: res.rows, rowCount: res.rowCount, duration };
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Postgres pool not initialized');
    }
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const pgAdapter = new PostgresAdapter();
