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

## Membuka bundle statis asli

Cukup buka `index.html` atau `login.html` di browser.