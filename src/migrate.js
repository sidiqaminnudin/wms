import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.js';
import { getConfig } from './config.js';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function migrate({ pool = createPool(), migrationsDir = path.join(root, 'migrations') } = {}) {
  if (!pool) throw new Error('DATABASE_URL is required to run migrations');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const files = (await readdir(migrationsDir)).filter(file => /^\d+_.+\.sql$/.test(file)).sort();
  for (const file of files) {
    const version = file.split('_', 1)[0];
    const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    if (existing.rowCount) continue;
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
    } finally { client.release(); }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = getConfig();
  const pool = createPool(config);
  try { await migrate({ pool }); console.log('Migrations complete'); }
  finally { await pool?.end(); }
}
