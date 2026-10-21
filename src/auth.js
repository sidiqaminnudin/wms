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
  router.use(session({
    name: 'wms.sid', secret,
    store: new Store({ pool, tableName: 'sessions', createTableIfMissing: false }),
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
    next();
  });
  router.get('/me', async (req, res) => {
    const companies = await pool.query('SELECT DISTINCT c.id, c.code FROM companies c JOIN user_company_roles u ON c.id = u.company_id WHERE u.user_id = $1 AND c.is_active ORDER BY c.code', [req.user.id]);
    respond(req, res, { user: req.user, allowed_companies: companies.rows, active_company_id: companies.rows.some(c => c.id === req.session.companyId) ? req.session.companyId : null });
  });
  router.post('/active-company', csrf, async (req, res) => {
    const id = req.body?.company_id;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return authError(req, res, 400, 'INVALID_INPUT', 'Perusahaan tidak valid.');
    const { rows } = await pool.query('SELECT DISTINCT c.id FROM companies c JOIN user_company_roles u ON c.id = u.company_id WHERE c.id = $1 AND u.user_id = $2 AND c.is_active', [id, req.user.id]);
    if (!rows.length) return authError(req, res, 403, 'FORBIDDEN', 'Akses ditolak.');
    const userId = req.user.id;
    await rotate(req);
    req.session.userId = userId;
    req.session.companyId = rows[0].id;
    req.session.csrf = randomBytes(32).toString('hex');
    respond(req, res, { active_company_id: rows[0].id, csrf_token: req.session.csrf });
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
