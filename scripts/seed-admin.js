import argon2 from 'argon2';
import { getConfig } from '../src/config.js';
import { createPool } from '../src/db.js';

const config = getConfig();
if (!config.databaseUrl) throw new Error('DATABASE_URL is required');
const required = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} environment variable is required; do not pass credentials interactively`);
  return value;
};
const username = required('ADMIN_USERNAME').toLowerCase();
const name = required('ADMIN_NAME');
const password = required('ADMIN_PASSWORD');
const companyCode = (process.env.ADMIN_COMPANY_CODE || 'SJLM').trim().toUpperCase();
if (!/^[a-z0-9._-]{3,100}$/.test(username) || password.length < 12 || !companyCode) throw new Error('Invalid admin input; password must be at least 12 characters');
const pool = createPool(config);
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length) throw new Error('Admin username already exists; refusing to replace credentials');
  const user = await client.query('INSERT INTO users(username, name, password_hash) VALUES ($1, $2, $3) RETURNING id', [username, name, hash]);
  const role = await client.query("SELECT id FROM roles WHERE code = 'ADMIN'");
  const company = await client.query('SELECT id FROM companies WHERE code = $1 AND is_active', [companyCode]);
  if (!role.rows[0] || !company.rows[0]) throw new Error('ADMIN role or company not found; run npm run migrate first');
  await client.query('INSERT INTO user_company_roles(user_id, company_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [user.rows[0].id, company.rows[0].id, role.rows[0].id]);
  await client.query('COMMIT');
  console.log(`Admin account provisioned for ${username} in ${companyCode}`);
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }

