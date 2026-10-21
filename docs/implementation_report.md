# Implementation checkpoint

## Status

Phase 0 documentation is available. Phase 1 UI shell is **implemented and validated**, but it is not production-ready and does not claim pixel-perfect reference fidelity. Original static HTML, CSS, JavaScript and reference assets remain preserved; application module templates are maintained separately under `views/modules/`.

The application currently provides Express/EJS public views, dedicated EJS module views under `views/modules/`, and a shared preview sidebar/topbar. Module views are generated from the preserved static bundle during implementation and rendered as committed application templates; the original bundle remains unchanged. Authentication is available when PostgreSQL and a strong session secret are configured; preview mode remains available without them and auth endpoints fail closed with 503.

## Validation performed

- `npm test`: 15 tests pass by default (one PostgreSQL integration test is skipped unless `TEST_DATABASE_URL` is set); with PostgreSQL integration enabled, all 16 tests pass, covering auth login, session rotation, CSRF/origin, company and warehouse isolation, permission revocation, logout, health, public rendering, preview routes, reusable components, and escaping.
- `npm run test:ui`: 9 Chromium browser tests pass, covering the shell, sidebar keyboard behavior, all module routes at 390/768/1440px, image/error checks, mobile table-card labels, and the active login form.
- Syntax checks passed for application, server and browser JavaScript.
- Browser testing exposed horizontal overflow on the mobile dashboard. Minimum-width constraints, topbar wrapping and responsive chart columns corrected it without hiding horizontal overflow globally.

These checks do not constitute reference-board visual comparison, comprehensive accessibility testing, all-page responsive coverage or backend/security certification. No screenshot fidelity claim is made.

## Phase 1 completion notes

- All 11 module routes render committed EJS templates under `views/modules/`; request-time reads/slicing of `pages/*.html` have been removed.
- KPI, status badge, data table, and form-field partials are integrated into module templates. Timeline, modal, toast, empty-state, pagination and tabs are demonstrated on the reference/components preview route.
- Preview-only actions, filters, search, notifications and forms are clearly disabled or labeled; no control posts operational data.
- Responsive card-style table views, mobile sidebar focus behavior, reduced-motion styling, manifest metadata and accessibility labels are covered by automated tests.
- Reference screenshots are generated at 390/768/1440px for all modules. Pixel-level comparison against supplied boards remains a manual design review; no pixel-fidelity or production-readiness claim is made.
- PWA app icons, installability verification, offline caching and service worker remain deferred.

Phase 2 authentication/security foundation is implemented and locally validated: PostgreSQL/session/Argon2id, fail-closed configuration, access-control migration, transactional migration runner, CSRF + Origin checks, rate limiting, session rotation, logout, active-company switching, permission resolution, warehouse-scoped auth endpoints, browser login/account/logout flow, and controlled admin provisioning. Complete operational-resource authorization, inventory workflows, MFA, and production deployment validation remain before full product acceptance.

## Later phases

Immutable inventory ledger, operational workflows, complete resource APIs, MFA and production deployment certification remain later work. Authentication/session, company selection, permission resolution, and warehouse-scoped auth endpoints are implemented and tested. Do not use Phase 1 preview data for operational decisions; preview-disabled redirects are not authentication middleware.

Preview is enabled only by explicit local configuration and defaults off in production. Validation created and removed isolated local test databases/schemas; no existing application database was reset. Chromium login, company switching, reload persistence and logout are exercised within the PostgreSQL integration test.
