import pg from 'pg';
import { getConfig } from './config.js';

const { Pool } = pg;

export function createPool(config = getConfig()) {
  if (!config.databaseUrl) return null;
  return new Pool({ connectionString: config.databaseUrl, max: 10, ssl: config.isProduction ? { rejectUnauthorized: true } : undefined });
}

export async function closePool(pool) {
  if (pool) await pool.end();
}
