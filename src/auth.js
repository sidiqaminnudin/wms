import { Router } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import argon2 from 'argon2';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

export function authError(req, res, status, code, message) {
  return res.status(status).json({ error: { code, message }, meta: { request_id: res.getHeader('X-Request-Id') } });
}

export function requireAuth(req, res, next) {
  if (!req.session?.userId) return authError(req, res, 401, 'UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.');
  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.auth?.permissions?.has(permission)) return authError(req, res, 403, 'FORBIDDEN', 'Akses ditolak.');
    next();
  };
}

export function requireWarehouseAccess(warehouseParam = 'warehouse_id') {
  return (req, res, next) => {
    const warehouseId = req.body?.[warehouseParam] ?? req.params?.[warehouseParam] ?? req.query?.[warehouseParam];
    if (typeof warehouseId !== 'string' || !req.auth?.warehouseIds?.has(warehouseId)) return authError(req, res, 403, 'FORBIDDEN', 'Akses gudang ditolak.');
    next();
  };
}

async function loadAuthorization(pool, userId, companyId) {
  const permissions = await pool.query(`
    SELECT DISTINCT p.code FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_company_roles ucr ON ucr.role_id = rp.role_id
    WHERE ucr.user_id = $1 AND ucr.company_id = $2`, [userId, companyId]);
  const warehouses = await pool.query(`
    SELECT DISTINCT w.id FROM warehouses w
    JOIN user_warehouse_access uwa ON uwa.warehouse_id = w.id
    WHERE uwa.user_id = $1 AND w.operator_company_id = $2 AND w.is_active`, [userId, companyId]);
  return { permissions: new Set(permissions.rows.map(row => row.code)), warehouseIds: new Set(warehouses.rows.map(row => row.id)) };
}

export function csrfProtection(origin) {
  return (req, res, next) => {
    const token = req.get('X-CSRF-Token') || req.body?._csrf;
    const expected = req.session?.csrf;
    const actualOrigin = req.get('Origin');
    if (actualOrigin !== origin || typeof token !== 'string' || !expected ||
        Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return authError(req, res, 403, 'INVALID_CSRF', 'Permintaan tidak valid. Muat ulang halaman.');
    }
    next();
  };
}

export function createAuth({ pool, secret, production, origin }) {
  const router = Router();
  const Store = connectPgSimple(session);
  const store = new Store({ pool, tableName: 'sessions', createTableIfMissing: false });
  router.close = async () => { if (typeof store.close === 'function') await store.close(); };
  router.use(session({
    name: 'wms.sid', secret,
    store,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure: production, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }
  }));
  router.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  const csrf = csrfProtection(origin);
  const respond = (req, res, data) => res.json({ data, meta: { request_id: res.getHeader('X-Request-Id') } });
  const rotate = req => new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  // A fixed dummy hash is generated once, not once per request, to reduce username timing disclosure.
  const dummyHash = argon2.hash(randomBytes(32), { type: argon2.argon2id });
  router.get('/csrf', (req, res) => {
    req.session.csrf ??= randomBytes(32).toString('hex');
    respond(req, res, { csrf_token: req.session.csrf });
  });
  router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }), csrf, async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 1024) {
      return authError(req, res, 401, 'INVALID_CREDENTIALS', 'Username atau password tidak valid.');
    }
    const { rows } = await pool.query('SELECT id, name, password_hash, status FROM users WHERE username = $1', [username.trim().toLowerCase()]);
    const user = rows[0];
    const valid = await argon2.verify(user?.password_hash || await dummyHash, password);
    if (!valid || !user || user.status !== 'ACTIVE') return authError(req, res, 401, 'INVALID_CREDENTIALS', 'Username atau password tidak valid.');
    const companies = await pool.query('SELECT DISTINCT c.id, c.code, c.name FROM companies c JOIN user_company_roles u ON u.company_id = c.id WHERE u.user_id = $1 AND c.is_active ORDER BY c.code', [user.id]);
    if (!companies.rows.length) return authError(req, res, 401, 'INVALID_CREDENTIALS', 'Username atau password tidak valid.');
    await rotate(req);
    req.session.userId = user.id;
    req.session.companyId = companies.rows[0].id;
    req.session.csrf = randomBytes(32).toString('hex');
    respond(req, res, { user: { id: user.id, name: user.name }, allowed_companies: companies.rows, csrf_token: req.session.csrf });
  });
  router.use(requireAuth);
  router.use(async (req, res, next) => {
    const { rows } = await pool.query('SELECT id, name FROM users WHERE id = $1 AND status = $2', [req.session.userId, 'ACTIVE']);
    if (!rows.length) {
      return req.session.destroy(error => error ? next(error) : authError(req, res, 401, 'UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.'));
    }
    req.user = rows[0];
    const companyRows = await pool.query('SELECT DISTINCT c.id, c.code, c.name FROM companies c JOIN user_company_roles u ON c.id = u.company_id WHERE u.user_id = $1 AND c.is_active ORDER BY c.code', [req.user.id]);
    if (!companyRows.rows.some(company => company.id === req.session.companyId)) req.session.companyId = companyRows.rows[0]?.id;
    req.auth = await loadAuthorization(pool, req.user.id, req.session.companyId);
    req.auth.companies = companyRows.rows;
    next();
  });
  router.get('/me', async (req, res) => {
    respond(req, res, { user: req.user, allowed_companies: req.auth.companies, active_company_id: req.session.companyId, permissions: [...req.auth.permissions], warehouse_ids: [...req.auth.warehouseIds] });
  });
  router.get('/context', (req, res) => respond(req, res, { company: req.auth.companies.find(company => company.id === req.session.companyId), permissions: [...req.auth.permissions], warehouse_ids: [...req.auth.warehouseIds] }));
  router.get('/warehouses', requirePermission('warehouse.read'), async (req, res) => {
    const { rows } = await pool.query('SELECT id, code, name FROM warehouses WHERE operator_company_id = $1 AND id = ANY($2::uuid[]) AND is_active ORDER BY code', [req.session.companyId, [...req.auth.warehouseIds]]);
    respond(req, res, rows);
  });
  router.get('/warehouses/:warehouse_id', requirePermission('warehouse.read'), requireWarehouseAccess(), async (req, res) => {
    const { rows } = await pool.query('SELECT id, code, name FROM warehouses WHERE id = $1 AND operator_company_id = $2 AND is_active', [req.params.warehouse_id, req.session.companyId]);
    if (!rows.length) return authError(req, res, 404, 'NOT_FOUND', 'Gudang tidak ditemukan.');
    respond(req, res, rows[0]);
  });
  router.post('/active-company', csrf, async (req, res) => {
    const id = req.body?.company_id;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return authError(req, res, 400, 'INVALID_INPUT', 'Perusahaan tidak valid.');
    const { rows } = await pool.query('SELECT DISTINCT c.id FROM companies c JOIN user_company_roles u ON c.id = u.company_id WHERE c.id = $1 AND u.user_id = $2 AND c.is_active', [id, req.user.id]);
    if (!rows.length) return authError(req, res, 403, 'FORBIDDEN', 'Akses ditolak.');
    const userId = req.user.id;
    await rotate(req);
    req.session.userId = userId;
    req.session.companyId = rows[0].id;
    req.session.csrf = randomBytes(32).toString('hex');
    req.auth = await loadAuthorization(pool, userId, rows[0].id);
    respond(req, res, { active_company_id: rows[0].id, csrf_token: req.session.csrf, permissions: [...req.auth.permissions], warehouse_ids: [...req.auth.warehouseIds] });
  });
  router.post('/logout', csrf, (req, res, next) => {
    req.session.destroy(error => {
      if (error) return next(error);
      res.clearCookie('wms.sid', { httpOnly: true, secure: production, sameSite: 'lax' });
      res.status(204).end();
    });
  });
  return router;
}
