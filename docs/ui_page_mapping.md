# UI PAGE MAPPING — WMS SJLM & GEKA

## Bundle Page → Application Route → Reference Images

| # | Bundle file | EJS view | Express route | Primary reference images |
|---|---|---|---|---|
| A | `index.html` | `views/pages/home.ejs` | `GET /` | `terracotta_warehouse_management_showcase.png`, `wms_sjlm_geka_ui_showcase_board.png` |
| B | `login.html` | `views/pages/login.ejs` | `GET /login`, `POST /login` | `wms_sjlm_geka_ui_showcase_board.png` |
| C | `pages/dashboard.html` | `views/pages/dashboard.ejs` | `GET /dashboard` | `orange_warehouse_management_dashboard.png`, `orange_warehouse_management_dashboard_board.png`, `wms_dashboard_ui_showcase_poster.png`, `warehouse_management_dashboard_showcase.png` |
| D | `pages/master-barang.html` | `views/pages/master-barang.ejs` | `GET /master-barang` | `wms_warehouse_management_ui_showcase.png`, `warehouse_management_ui_dashboard_board.png` |
| E | `pages/permintaan.html` | `views/pages/permintaan.ejs` | `GET /permintaan` | `wms_permintaan_barang_approval_showcase.png`, `geka_warehouse_approval_dashboard_mockup.png` |
| F | `pages/alokasi-internal.html` | `views/pages/alokasi-internal.ejs` | `GET /alokasi-internal` | `wms_internal_allocation_ui_ux_board.png` |
| G | `pages/pengiriman-penerimaan.html` | `views/pages/pengiriman-penerimaan.ejs` | `GET /pengiriman-penerimaan` | `warehouse_shipping_receiving_ui_showcase.png` |
| H | `pages/teknisi-stockopname.html` | `views/pages/teknisi-stockopname.ejs` | `GET /teknisi-stockopname` | `wms_teknisi_dan_stock_opname_board.png` |
| I | `pages/procurement.html` | `views/pages/procurement.ejs` | `GET /procurement` | (general dashboard boards) |
| J | `pages/projects.html` | `views/pages/projects.ejs` | `GET /projects` | (general dashboard boards) |
| K | `pages/reports.html` | `views/pages/reports.ejs` | `GET /reports` | (general dashboard boards) |
| L | `pages/admin-settings.html` | `views/pages/admin-settings.ejs` | `GET /admin/settings` | (general dashboard boards) |

## Reusable Partials Identified

| Partial | Source pattern | Used by |
|---|---|---|
| `_sidebar.ejs` | `<aside class="sidebar">` block (repeated in all pages) | All authenticated pages |
| `_topbar.ejs` | `<div class="topbar">` block | All authenticated pages |
| `_kpi-card.ejs` | `<div class="kpi">` | Dashboard, pengiriman, teknisi, projects, reports |
| `_data-table.ejs` | `<div class="table-wrap"><table>` | All module pages |
| `_status-badge.ejs` | `<span class="status ...">` / `<span class="badge ...">` | All |
| `_timeline.ejs` | `<div class="timeline">` | Permintaan, alokasi, procurement |
| `_form-field.ejs` | `<div class="input-group">` | Master barang, permintaan, teknisi, admin |
| `_section-head.ejs` | `<div class="section-head">` | All cards with title+action |
| `_tabs.ejs` | `<div class="tabs">` | Master barang, permintaan, alokasi, admin |
| `_progress-bar.ejs` | `<div class="progress" data-progress>` | Dashboard, teknisi, reports |
| `_pagination.ejs` | (to be created) | All list pages |
| `_modal.ejs` | (to be created) | Forms, confirmation dialogs |
| `_toast.ejs` | (to be created) | Feedback notifications |
| `_empty-state.ejs` | (to be created) | Tables/cards with no data |
| `_mobile-nav.ejs` | `<div class="mobile-nav">` from CSS | Mobile shell |
