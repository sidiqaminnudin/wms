import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import helmet from 'helmet';
import { getConfig } from './config.js';
import { createPool } from './db.js';
import { createAuth, authError } from './auth.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export const navigation = [
  ['dashboard', 'Dashboard', 'grid'], ['master-barang', 'Master Barang', 'box-seam'],
  ['permintaan', 'Permintaan', 'clipboard-check'], ['alokasi-internal', 'Alokasi Internal', 'boxes'],
  ['pengiriman-penerimaan', 'Pengiriman & Penerimaan', 'truck'],
  ['teknisi-stockopname', 'Teknisi & Stock Opname', 'tools'],
  ['procurement', 'Pengadaan', 'bag-check'], ['projects', 'Proyek Instansi', 'buildings'],
  ['reports', 'Laporan', 'bar-chart'], ['admin-settings', 'Administrasi', 'gear'],
  ['references', 'Referensi Desain', 'images']
];

export function createApp({ preview = getConfig().preview, config = getConfig(), pool = createPool(config) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('views', path.join(root, 'views'));
  app.set('view engine', 'ejs');
  app.use((req, res, next) => {
    res.setHeader('X-Request-Id', randomUUID());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });
  // Existing slicing uses inline styles; CSP rollout requires a separate template audit.
  app.use(helmet({ contentSecurityPolicy: false, strictTransportSecurity: config.isProduction ? undefined : false }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use(express.json({ limit: '16kb' }));
  if (pool && config.sessionSecret?.length >= 32) {
    app.use('/api/v1/auth', createAuth({ pool, secret: config.sessionSecret, production: config.isProduction, origin: config.appOrigin }));
  } else {
    app.use('/api/v1/auth', (req, res) => authError(req, res, 503, 'AUTH_UNAVAILABLE', 'Autentikasi belum dikonfigurasi.'));
  }
  app.use('/public', express.static(path.join(root, 'public')));
  app.use('/assets/css', express.static(path.join(root, 'assets/css')));
  app.use('/vendor/bootstrap', express.static(path.join(root, 'node_modules/bootstrap/dist')));
  app.use('/vendor/icons', express.static(path.join(root, 'node_modules/bootstrap-icons/font')));
  app.use('/vendor/inter', express.static(path.join(root, 'node_modules/@fontsource/inter')));
  if (preview) app.use('/assets/img/reference', express.static(path.join(root, 'assets/img/reference')));
  app.get('/health', (req, res) => res.json({ success: true, message: 'Server ready', data: { stage: 'ui-foundation' }, meta: {} }));
  app.get('/', (req, res) => res.render('pages/home', { title: 'WMS SJLM & GEKA' }));
  app.get('/login', (req, res) => res.render('pages/login', { title: 'Masuk — WMS' }));
  for (const [slug, title] of navigation) {
    app.get([`/${slug}`, ...(slug === 'admin-settings' ? ['/admin/settings'] : [])], (req, res) => {
      if (!preview) return res.redirect('/login');
      res.render('pages/preview', { title, slug, navigation, preview, moduleView: `modules/${slug}` });
    });
  }
  app.use((req, res) => res.status(404).render('pages/message', { title: 'Halaman tidak ditemukan', message: 'Periksa alamat halaman atau kembali ke beranda.' }));
  app.use((error, req, res, next) => {
    console.error(JSON.stringify({ level: 'error', requestId: res.getHeader('X-Request-Id'), message: error.message }));
    res.status(500).render('pages/message', { title: 'Terjadi kesalahan', message: 'Silakan coba kembali. Hubungi administrator jika masalah berlanjut.' });
  });
  return app;
}
export default createApp();
