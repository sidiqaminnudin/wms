import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

function request(path) {
  const server = createApp({ preview: true }).listen(0);
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    http.get({ port, path }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => { server.close(); resolve({ status: response.statusCode, body }); });
    }).on('error', error => { server.close(); reject(error); });
  });
}

test('health endpoint reports UI foundation stage', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.match(response.body, /ui-foundation/);
});

test('homepage and preview dashboard render through EJS', async () => {
  const home = await request('/');
  assert.equal(home.status, 200);
  assert.match(home.body, /Kelola Gudang SJLM/);
  const dashboard = await request('/dashboard');
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.body, /UI preview/);
  assert.match(dashboard.body, /Dashboard/);
});

test('public manifest is available and advertises the app shell', async () => {
  const response = await request('/public/manifest.webmanifest');
  assert.equal(response.status, 200);
  const manifest = JSON.parse(response.body);
  assert.equal(manifest.name, 'WMS SJLM & GEKA');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.theme_color, '#f97316');
  for (const route of ['/', '/login', '/dashboard']) {
    const page = await request(route);
    assert.match(page.body, /rel="manifest" href="\/public\/manifest.webmanifest"/);
    assert.match(page.body, /name="theme-color" content="#f97316"/);
  };
});

test('all mapped preview routes render and static assets are available', async () => {
  const routes = ['dashboard', 'master-barang', 'permintaan', 'alokasi-internal', 'pengiriman-penerimaan', 'teknisi-stockopname', 'procurement', 'projects', 'reports', 'admin-settings', 'references'];
  for (const route of routes) {
    const response = await request(`/${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.body, /UI preview/, route);
    assert.match(response.body, new RegExp(`href=\"/${route}\"`), route);
  }
  const css = await request('/public/css/app.css');
  assert.equal(css.status, 200);
  assert.match(css.body, /preview-banner/);
  assert.match(css.body, /Compact mobile tables/);
  const missing = await request('/not-found');
  assert.equal(missing.status, 404);
  assert.match(missing.body, /Halaman tidak ditemukan/);
});

test('module views use reusable components and disable preview-only controls', async () => {
  const dashboard = await request('/dashboard');
  assert.match(dashboard.body, /class="kpi"/);
  const master = await request('/master-barang');
  assert.match(master.body, /data-label="Nama Barang"/);
  assert.match(master.body, /disabled/);
  assert.match(master.body, /Tidak tersedia dalam preview/);
  const references = await request('/references');
  assert.match(references.body, /Komponen UI preview/);
  assert.match(references.body, /componentModal/);
  assert.match(references.body, /data-preview-toast/);
});

test('production mode protects preview module routes', async () => {
  const app = createApp({ preview: false });
  const server = app.listen(0);
  const { port } = server.address();
  const response = await new Promise((resolve, reject) => http.get({ port, path: '/dashboard' }, result => {
    result.resume(); result.on('end', () => resolve(result));
  }).on('error', reject));
  server.close();
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, '/login');
});
