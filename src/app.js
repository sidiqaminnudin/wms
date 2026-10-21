import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

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

export function createApp({ preview = process.env.UI_PREVIEW === 'true' && process.env.NODE_ENV !== 'production' } = {}) {
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
  app.use(express.urlencoded({ extended: false }));
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
      const html = readFileSync(path.join(root, 'pages', `${slug}.html`), 'utf8');
      // Only trusted, repository-owned slicing markup is rendered unescaped.
      const contentStart = Math.min(...['<div class="page-title">', '<div class="section-head">']
        .map(marker => html.indexOf(marker)).filter(index => index >= 0));
      const main = html.slice(contentStart, html.indexOf('<div class="footer-note">'))
        .replaceAll('../assets/', '/assets/').replace(/href="([a-z-]+)\.html"/g, 'href="/$1"');

      res.render('pages/preview', { title, slug, navigation, content: main, preview });
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
