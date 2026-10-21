# API SPECIFICATION — WMS SJLM & GEKA

**Version:** v1.0 (proposed contract)  
**Base URL:** `/api/v1`  
**Format:** JSON UTF-8; ISO-8601 timestamps in UTC, quantities transmitted as **decimal strings** (`"20.000"`) to avoid floating-point errors.  
**Status:** Implementation spec; endpoints are not yet running.

## 1. Authentication and authorization
Browser UI uses a server-side session and cookies `HttpOnly; Secure; SameSite=Lax`; HTTPS required. Passwords hashed with Argon2id. CSRF token required on state-changing browser requests; enforce Origin checks. API requests require active session, permission, and company/warehouse scope checks for **each resource**. `GET /auth/me` returns assigned scopes. Management's cross-company view requires a dedicated permission, not just client-supplied company ID. Avoid exposing supplier prices to GEKA users unless granted. Rate-limit login; support session revoke and eventual MFA.

### Headers
```http
Content-Type: application/json
Accept: application/json
X-CSRF-Token: <session-token>    # mutating browser requests
Idempotency-Key: <unique-key>   # stock posting operations
X-Request-Id: <optional-client-correlation-id>
```
Do not place passwords, bearer tokens or API keys in query strings. For web sessions, do not claim `Authorization: Bearer` is required.

## 2. Standard response format
Success:
```json
{"data":{"id":"uuid","status":"submitted"},"meta":{"request_id":"req-123"}}
```
Error:
```json
{"error":{"code":"INSUFFICIENT_STOCK","message":"Available quantity is lower than requested quantity","details":{"available_qty":"8.000","requested_qty":"10.000"}},"meta":{"request_id":"req-123"}}
```
HTTP statuses: `200` fetched/updated, `201` created, `204` no body, `400` bad input, `401` unauthenticated, `403` unauthorized, `404` not found (including intentionally hidden foreign-company resource), `409` conflict/invalid state/duplicate, `422` business rule failure, `429` rate limit, `500` unexpected. Never reveal other tenant resource existence through error details.

Paginated list:
```json
{"data":[],"meta":{"page":1,"page_size":25,"total":0,"request_id":"req-123"}}
```
Query lists must have max size limit, sorting allowlist, and filtering by authenticated scope.

## 3. Endpoint catalog
| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public/rate-limited | Session established |
| POST | `/auth/logout` | Authenticated | Revoke session |
| GET | `/auth/me` | Authenticated | Roles, scopes, session user |
| GET | `/companies` | Scoped | Only authorized companies |
| POST | `/auth/active-company` | Authenticated | Switch authorized view context, server checks access |
| GET/POST | `/products` | `product.read` / `product.create` | Catalog |
| GET/PATCH | `/products/:id` | `product.read` / `product.update` | Product record |
| GET | `/warehouses` | `warehouse.read` | Authorized warehouses only |
| GET | `/inventory/balances` | `inventory.read` | Owner, warehouse, location, condition filters |
| GET | `/inventory/movements` | `inventory.read` | Immutable ledger list |
| GET | `/inventory/serials/:serial` | `inventory.read` | Scoped serial trace |
| GET/POST | `/stock-requests` | `request.read` / `request.create` | Request lifecycle |
| GET | `/stock-requests/:id` | `request.read` | Includes lines and history |
| POST | `/stock-requests/:id/submit` | `request.submit` | Draft → submitted |
| POST | `/stock-requests/:id/approve` | `request.approve` | May partially approve |
| POST | `/stock-requests/:id/reject` | `request.approve` | Requires reason |
| POST | `/stock-requests/:id/cancel` | `request.cancel` | Only allowed states |
| GET/POST | `/allocations` | `allocation.read` / `allocation.create` | Based on approved request |
| GET | `/allocations/:id` | `allocation.read` | Cross-company authorized participants |
| POST | `/allocations/:id/reserve` | `allocation.reserve` | Atomic reservation |
| POST | `/allocations/:id/shipments` | `shipment.create` | Create partial/full shipment draft |
| POST | `/shipments/:id/dispatch` | `shipment.dispatch` | Posts stock into transit |
| POST | `/shipments/:id/receipts` | `receipt.create` | Draft receipt from shipment |
| POST | `/receipts/:id/confirm` | `receipt.confirm` | Posts to GEKA/quarantine; discrepancy |
| GET/POST | `/technician-issues` | `tech_issue.read` / `tech_issue.create` | Custody movement |
| POST | `/technician-issues/:id/confirm` | `tech_issue.confirm` | Technician receipt |
| POST | `/technician-issues/:id/usages` | `tech_usage.create` | Consume/install/return/damaged |
| GET | `/technicians/me/inventory` | `tech_inventory.read_self` | Own custody only |
| GET/POST | `/stock-opnames` | `opname.read` / `opname.create` | Count workflows |
| POST | `/stock-opnames/:id/submit` | `opname.submit` | Review requested |
| POST | `/stock-opnames/:id/approve` | `opname.approve` | Four-eyes approval |
| POST | `/stock-opnames/:id/post` | `opname.post` | Correction ledger |
| GET | `/reports/stock` | `report.stock` | Owner/location distinct |
| GET | `/reports/allocations` | `report.allocations` | Outstanding allocations |
| GET | `/reports/technicians` | `report.technicians` | Custody/usage |
| GET | `/audit-logs` | `audit.read` | Sensitive admin/auditor endpoint |

## 4. Critical payload examples
The UUIDs shown below are placeholders and must be replaced with actual existing IDs.

### Login
```http
POST /api/v1/auth/login
```
```json
{"email":"staff@example.com","password":"<user-secret>"}
```
```json
{"data":{"user":{"id":"<user-uuid>","name":"Warehouse Staff"},"allowed_companies":[{"code":"GEKA","id":"<company-uuid>"}]}}
```

### Create GEKA → SJLM request
```http
POST /api/v1/stock-requests
```
```json
{
  "requester_company_id":"<geka-company-uuid>",
  "source_warehouse_id":"<sjlm-warehouse-uuid>",
  "destination_warehouse_id":"<geka-warehouse-uuid>",
  "purpose":"GEKA network installations",
  "priority":"normal",
  "items":[{"product_id":"<onu-product-uuid>","quantity":"20.000","unit_code":"PCS"}]
}
```
Server verifies requester affiliation and that both warehouses participate in an allowed SJLM→GEKA allocation workflow. No client-selected owner change.

### Partial approval
```http
POST /api/v1/stock-requests/<request-id>/approve
```
```json
{"items":[{"request_item_id":"<item-uuid>","approved_qty":"18.000"}],"note":"18 available now"}
```
Only an SJLM role with scoped permission may approve. Result: `approved_partial`, with remaining 2 not implicitly approved.

### Reserve approved items
```http
POST /api/v1/allocations/<allocation-id>/reserve
Idempotency-Key: reserve-<unique-value>
```
```json
{"source_location_id":"<sjlm-bin-uuid>","items":[{"allocation_item_id":"<line-uuid>","quantity":"18.000"}]}
```
Reservations must be atomic with availability check; reserved stock remains physically on-hand until dispatch.

### Dispatch into transit
```http
POST /api/v1/shipments/<shipment-id>/dispatch
Idempotency-Key: dispatch-<unique-value>
```
```json
{"dispatched_at":"2026-10-17T08:00:00Z","items":[{"shipment_item_id":"<item-uuid>","shipped_qty":"18.000","serial_ids":[]}]}
```
For serialized products, pass exactly one valid unit identifier per unit (e.g. 18 serial IDs for 18 serialized ONU). Shipment must be approved and reserved, and source balances must reconcile.

### Receipt with discrepancy
```http
POST /api/v1/receipts/<receipt-id>/confirm
Idempotency-Key: receive-<unique-value>
```
```json
{
  "received_at":"2026-10-17T09:00:00Z",
  "destination_location_id":"<geka-bin-uuid>",
  "quarantine_location_id":"<geka-quarantine-uuid>",
  "items":[{"receipt_item_id":"<item-uuid>","accepted_qty":"16.000","damaged_qty":"1.000","missing_qty":"1.000","note":"Outer packaging damaged"}]
}
```
If shipment has 18 units, 16 enter usable GEKA, 1 enters quarantine, and 1 stays unresolved/in transit pending investigation. A discrepancy record is mandatory; receipt status is `discrepancy`. No silent disappearance or negative transit.

### Technician issue and usage
```http
POST /api/v1/technician-issues
```
```json
{"work_order_id":"<work-order-uuid>","technician_id":"<user-uuid>","from_location_id":"<geka-bin-uuid>","items":[{"product_id":"<onu-product-uuid>","quantity":"3.000","serial_ids":[]}]}
```
`POST /technician-issues/:id/confirm` posts transfer to technician custody (or use a two-step acknowledged receipt, configured consistently). Usages can include `action=INSTALLED`, `RETURNED`, `DAMAGED` with work order reference; each serial can only be consumed/installed once.

## 5. State transition guarantees
- Request `draft → submitted → approved/approved_partial/rejected → fulfilled...`; rejected cannot be dispatched.
- Allocation approved and reserved before dispatch; shipment dispatch cannot be repeated.
- Receipt only for dispatched shipment, cumulative quantities ≤ shipped, missing items remain unreconciled.
- Opname corrections only after approval and based on validated cutoff.
- All posted moves are append-only and reversible only by new authorized corrective transactions.
- No inventory post if database transaction fails; a prior completed idempotent operation returns same response.

## 6. Error codes and validations
`AUTH_REQUIRED`, `PERMISSION_DENIED`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_STATE_TRANSITION`, `INSUFFICIENT_STOCK`, `SERIAL_NOT_AVAILABLE`, `SERIAL_DUPLICATE`, `OVER_RECEIPT`, `APPROVAL_REQUIRED`, `COMPANY_SCOPE_FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `STOCK_CONCURRENCY_CONFLICT`, `CSRF_INVALID`.

All quantities must be decimal strings > 0 with supported unit conversion and product precision. Business rule failures are usually `409` or `422` and must never leak cross-tenant data. Reject unknown writable fields (mass assignment defense).

## 7. Audit, exports, documentation, and tests
Write audit log for login attempts (no password), approval, stock posting, discrepancy, returns, role changes, and corrections. Generate `request_id` and use it in logs, response headers, and reporting. Store attachments privately with authorization and MIME/size checks. CSV/XLSX/PDF exports filter by user's scopes and avoid exposing internal cost fields to unauthorized roles. Version OpenAPI schema (`openapi.yaml`) and test with a generated Postman collection.

### Acceptance API tests
1. Unauthorized GEKA admin requests `GET /allocations/<sjlm-private-id>` → 404/403 without leakage.
2. Simultaneous reservations for final units: only permitted available amount succeeds.
3. Repeated dispatch with same idempotency key: exactly one journal posting.
4. 18 shipped; 16 accepted, 1 damaged, 1 missing → correct usable/quarantine/transit and discrepancy.
5. Serialized ONU cannot be in SJLM and GEKA at once.
6. Technician usages cannot exceed issued custody quantity.
7. A stock opname adjustment rejected without approval, even when frontend hides the action.
8. Exports and aggregate reports respect tenant/warehouse scope.

## 8. Deployment / security notes
Serve app behind Nginx HTTPS on Debian/Proxmox LXC. Set trusted proxy hops precisely, cookie security, explicit CORS if any, strict content security policy, DB least privilege, periodic backups/restore tests. Use environment variables for secrets and do not commit `.env`. Avoid exposing PostgreSQL to the public Internet.
