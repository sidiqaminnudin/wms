import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfig } from '../src/config.js';
import { csrfProtection, requireAuth } from '../src/auth.js';
import { migrate } from '../src/migrate.js';

function response() {
  return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, getHeader() { return 'test'; } };
}

test('production fails closed without database and a strong session secret', () => {
  assert.throws(() => getConfig({ NODE_ENV: 'production' }), /Production requires/);
  assert.throws(() => getConfig({ PORT: 'invalid' }), /PORT/);
  const config = getConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://localhost/wms', SESSION_SECRET: 'x'.repeat(32), APP_ORIGIN: 'https://wms.example', UI_PREVIEW: 'true' });
  assert.equal(config.preview, false);
});

test('CSRF rejects missing tokens and foreign origins, accepts matching token and origin', () => {
  const middleware = csrfProtection('https://wms.example');
  for (const [token, origin, accepted] of [['secret', 'https://wms.example', true], ['wrong', 'https://wms.example', false], ['secret', 'https://evil.example', false], [undefined, undefined, false]]) {
    const res = response();
    let next = false;
    middleware({ session: { csrf: 'secret' }, get: name => name === 'Origin' ? origin : token }, res, () => { next = true; });
    assert.equal(next, accepted);
    if (!accepted) assert.equal(res.code, 403);
  }
});

test('anonymous API access is denied', () => {
  const res = response();
  requireAuth({}, res, () => assert.fail('must not authorize'));
  assert.equal(res.code, 401);
});

test('migrations refuse to run without a configured database', async () => {
  await assert.rejects(migrate({ pool: null }), /DATABASE_URL/);
});
