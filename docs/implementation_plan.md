# IMPLEMENTATION PLAN — WMS SJLM & GEKA

**Starting point:** static UI slicing bundle; no backend/database exists.
**Principle:** preserve existing bundle, add production application incrementally, validate each phase before continuing.

## Phase 0 — Audit & Planning (current)

- [x] Inspect root, bundle manifest, README and all supplied architecture documents.
- [x] Inspect all HTML pages, CSS and JavaScript.
- [x] Enumerate all 13 reference assets; inspect available image previews and record image-tool limitations.
- [x] Create `implementation_audit.md`.
- [x] Create `ui_page_mapping.md`.
- [x] Create this implementation plan.

## Phase 1 — Design System and Base Layout

1. Create `package.json` using ESM, Express, EJS and confirmed-compatible dependencies.
2. Add `src/app.js` and `src/server.js` with centralized error handling, request IDs and safe environment config.
3. Add EJS layout/partials for sidebar, topbar, profile/company switcher, badges, KPI cards, table shell, forms, timeline, toast, empty state and mobile navigation.
4. Add Bootstrap 5 and Bootstrap Icons through package/CDN policy while retaining bundle CSS variables and visual language.
5. Add responsive shell: desktop sidebar, tablet collapse, mobile offcanvas/card patterns.
6. Implement route mapping to the current page designs using non-sensitive, clearly labeled preview data only.
7. Add PWA-ready manifest and accessibility basics (labels, focus states, reduced motion).
8. Verify every route, static asset path, and mobile breakpoint.

**Exit criteria:** all mapped pages render through EJS; no visual regression against the existing slicing shell; preview data is not represented as live operational data.

## Phase 2 — Authentication and Multi-company

- PostgreSQL session store, Argon2id password hashes, CSRF, secure cookie policy and login rate limiting.
- User/company/role/permission/warehouse-scope middleware.
- Generic login errors, logout/session rotation/expiration, server-side active company.
- Tests for unauthorized access and cross-company ID substitution.

## Phase 3 — Master Data and Inventory

- Versioned PostgreSQL migrations and safe seed of companies, roles, permissions.
- Products/categories/units/warehouses/locations/suppliers.
- Inventory balances as materialized state plus immutable stock transaction/movement ledger.
- Atomic posting with numeric quantities, deterministic row locks, idempotency and audit log.

## Phase 4 — Request, Approval, ISA, Shipment, Receipt

- Request lifecycle and partial approval.
- ISA status machine and authorization.
- Reservation, picking/dispatch to transit, partial receipt, damage/quarantine and discrepancy resolution.
- Integration tests for concurrency, over-receipt and repeated idempotency keys.

## Phase 5 — Technician and Stock Opname

- Technician custody, issue/confirm, usage/install/return/damaged.
- Opname sessions, counting, review, approval and corrective ledger transactions.

## Phase 6 — Procurement and Projects

- Supplier/PR/PO status workflow and receipt references.
- Projects, clients, project allocation and delivery documentation.
- Cost fields remain permission-gated and hidden by default.

## Phase 7 — Reports and Administration

- Scope-safe reports and CSV/XLSX/PDF exports.
- User, role, company, warehouse, notification, threshold and audit-log administration.

## Phase 8 — QA and Deployment

- Unit/integration/e2e tests, Playwright screenshots where available, responsive/accessibility/security review.
- Nginx reverse proxy, Debian/LXC instructions, backup/restore runbook, `.env.example`, deployment documentation.
- Final `docs/implementation_report.md` with completed/deferred items, tests and visual fidelity status.

## Safeguards

- Do not reset or drop a database after real data exists.
- Do not post inventory outside a database transaction and ledger entry.
- Do not trust client company/warehouse/owner/role values.
- Do not expose prices by default.
- Do not claim pixel-perfect fidelity without screenshot comparison.
- Keep deferred features from `system_map.md` clearly labeled as deferred.
