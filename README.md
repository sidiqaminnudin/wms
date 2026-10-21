# WMS SJLM & GEKA — UI Slicing Bundle

Bundle ini berisi slicing HTML/CSS/JS statis untuk membantu implementasi atau adopsi desain WMS SJLM & GEKA berdasarkan mockup visual yang sudah digenerate.

## Isi utama

- `index.html` — homepage / landing page
- `login.html` — login dengan **username** + **password**
- `pages/dashboard.html` — dashboard utama
- `pages/master-barang.html` — master barang & inventaris
- `pages/permintaan.html` — permintaan barang & approval
- `pages/alokasi-internal.html` — alokasi internal SJLM → GEKA
- `pages/pengiriman-penerimaan.html` — pengiriman & penerimaan
- `pages/teknisi-stockopname.html` — teknisi & stock opname
- `pages/procurement.html` — purchase order / pengadaan
- `pages/projects.html` — proyek instansi
- `pages/reports.html` — laporan & analisis
- `pages/admin-settings.html` — administrasi / pengaturan
- `pages/references.html` — galeri seluruh gambar referensi

## Folder

- `assets/css/style.css` — style utama
- `assets/js/app.js` — interaksi kecil/progress helper
- `assets/img/reference/` — seluruh gambar hasil generate sebagai acuan visual
- `docs/` — `system_map.md`, `database_design.md`, `api_spec.md`

## Catatan implementasi

1. Bundle ini adalah **slicing UI statis**, bukan aplikasi backend final.
2. Nilai/harga sengaja tidak ditonjolkan; perlakukan sebagai **opsional** hanya pada modul tertentu.
3. Warna menggunakan palet yang mengikuti identitas visual GEKA.
4. Untuk integrasi ke proyek Node.js/Express/Bootstrap, kamu bisa:
   - memecah layout menjadi partial `header`, `sidebar`, `topbar`, dan `content`
   - memindahkan data dummy ke API/backend
   - mengubah tombol/form menjadi koneksi ke route yang sesuai
5. Login dibuat sederhana dengan field `username` dan `password`.

## Saran adopsi ke proyek WMS

- Ubah `pages/*.html` menjadi template engine (EJS, Handlebars, Nunjucks, dll.)
- Ubah card, tabel, dan form ke komponen reusable
- Hubungkan filter ke query server/API
- Gunakan `assets/img/reference` untuk validasi tampilan selama implementasi

## Menjalankan Phase 1 application shell

Memerlukan Node.js 22+:

```bash
npm install
copy .env.example .env
npm start
```

Buka `http://localhost:3000/`. Preview modul dapat diaktifkan secara lokal melalui `UI_PREVIEW=true`; preview tidak mewakili data operasional dan akan dinonaktifkan jika `NODE_ENV=production`.

Untuk validasi:

```bash
npm test
npm run test:ui
```

## Phase 2 foundation (belum production-ready)

Auth API tersedia di `/api/v1/auth`: `GET /csrf`, `POST /login`, `GET /me`, `GET /context`, `GET /warehouses`, `GET /warehouses/:warehouse_id`, `POST /active-company`, dan `POST /logout`. Login API memakai `username` + `password`; halaman `/login` menjalankan flow CSRF/session dan `/account` menampilkan company serta warehouse scope server-side.

- Isi `DATABASE_URL`, `SESSION_SECRET` (minimal 32 karakter), dan `APP_ORIGIN` (origin persis, misalnya `http://localhost:3000`) pada environment lokal.
- Jalankan `npm run migrate` pada PostgreSQL yang disiapkan untuk aplikasi. Migration hanya menambah schema; tidak membuat user/password default dan tidak drop/reset database.
- Request mutasi wajib menyertakan cookie session, `Origin` yang sesuai `APP_ORIGIN`, dan `X-CSRF-Token` dari `GET /api/v1/auth/csrf`.
- Tanpa konfigurasi database/session yang lengkap, auth API mengembalikan 503. Production gagal startup tanpa database URL dan secret kuat.
- Production cookies memakai Secure/HttpOnly/SameSite=Lax; deployment TLS/reverse-proxy masih perlu validasi. Jangan mengaktifkan produksi sebelum RBAC/warehouse scope dan integration tests lengkap.
- `npm run seed:admin` membuat satu admin menggunakan `ADMIN_USERNAME`, `ADMIN_NAME`, `ADMIN_PASSWORD`, dan optional `ADMIN_COMPANY_CODE`; credential wajib lewat environment dan username yang sudah ada ditolak.
- Migration, login salah/benar, session rotation, CSRF/origin, company/warehouse isolation, permission revocation, dan logout telah divalidasi terhadap PostgreSQL lokal melalui integration test. Database test dibersihkan setelah pengujian.

## Membuka bundle statis asli

Cukup buka `index.html` atau `login.html` di browser.