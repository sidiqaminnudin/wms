# Phase 1 preview components

Module templates live in `views/modules/` and use the shared `views/pages/preview.ejs` shell. Paths passed to EJS includes come only from the server-owned navigation list, never request parameters. The original static bundle remains unchanged.

## Partial inputs

| Partial | Required inputs | Optional inputs |
| --- | --- | --- |
| `_kpi-card` | `label`, `value`, `description`, `variant`, `icon` | none |
| `_status-badge` | `kind`, `variant`, `text` | none |
| `_data-table` | `headers` (array), `rows` (array of cell arrays) | none |
| `_form-field` | `id`, `label`, `control` | none |
| `_modal` | `id`, `title`, `body` | `size` (`sm`, `lg`, `xl`), `actions` |
| `_toast` | `message` | `title`, `variant`, `autohide` (default true) |
| `_empty-state` | `title` | `icon`, `message`, `action` (`href`, `label`) |
| `_pagination` | none | `pages` (`number`, `href`, `current`), `current`, `previous`, `next` |
| `_tabs` | none | `tabs` (`id`, `label`, `href`, `active`), `active`, `label` |
| `_timeline` | none | `items` (`title`, `meta`, `description`, `status`), `label` |

Text is escaped by EJS except explicit trusted-markup inputs: modal `body`/`actions`, form `control`, table `headers`/cell values, and rendered includes. These accept **repository-owned markup only**, not database or request content. Future backend integration must escape untrusted cell values before composing markup or change the table API to escaped structured values. Escaping attributes does not validate URL schemes; callers must supply approved local URLs. Class variants are developer-controlled, not user input.

The form-field partial associates its label with an ID already present on the supplied control. Module controls are disabled because filters/writes are not implemented. Tabs are ordinary navigation links with `aria-current`, not ARIA tab widgets. Mobile tables retain header markup and display each column label beside the cell content.

`/references` demonstrates the six general-purpose partials including a working Bootstrap modal and toast. No demonstration saves data. Company/warehouse badges are display-only preview scope, not authorization controls.

## Validation artifacts

Run `npm test` and `npm run test:ui`. Browser tests generate full-page module screenshots in ignored `test-results/` at widths 390, 768 and 1440. These are current render artifacts, not approved visual regression baselines. Install Playwright Chromium with `npx playwright install chromium` if unavailable.

PWA manifest metadata is present; offline support, icon assets and installability certification are not part of this preview milestone.
