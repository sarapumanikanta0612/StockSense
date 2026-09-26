# StockSense Team Context

## Project

StockSense is an Inventory Management System for centralizing stock management and providing real-time visibility into inventory operations.

## Team

- Developer 1 → Frontend / UI
- Developer 2 → Inventory Operations
- Developer 3 → Backend / Database / Authentication
- Developer 4 → AI / Smart Features

## Current Status

Initial shared setup completed.

The frontend foundation, dashboard UI, and Product Management UI are implemented on the `frontend` branch. The backend foundation, authentication, catalog, warehouse/location, inventory operations, stock query, ledger, inventory hardening, and read-only Smart Inventory analytics are implemented in work now present on `main`. Frontend API integration remains deferred.

## Current Work

- Developer 1: React frontend foundation, application shell, dashboard UI, and complete frontend-only Product Management experience implemented
- Developer 2: Inventory operation hardening implemented on the `inventory` branch; PostgreSQL workflow validation awaits an isolated `TEST_DATABASE_URL`
- Developer 3: Backend foundation complete — ready for team integration
- Developer 4: Smart Inventory analytics + low-stock intelligence implemented on branch `dev4-smart-features` (read-only, additive)

## Inventory Operations Status

Developer 2 extended the existing central inventory service without changing the database schema, route structure, or request DTOs:

- Receipt, delivery, transfer, and adjustment validation now rechecks that every product, location, and parent warehouse is active inside the same serializable transaction that posts stock. A failed check returns `INVALID_PRODUCT` or `INVALID_LOCATION`; the document remains `DRAFT`, and no balance or movement changes persist.
- Transient Prisma `P2034` write/serialization conflicts are retried within the inventory service up to three total attempts. If contention persists, validation returns `INVENTORY_CONFLICT` (409) with `details.retryable: true`; no partial stock change is committed.
- Existing guarantees remain unchanged: receipt increases destination stock, delivery decreases source stock, transfer atomically moves stock without changing product-wide quantity, signed adjustment applies a location delta, negative stock is rejected, and each successfully validated item creates exactly one immutable ledger movement.
- PostgreSQL integration coverage now includes positive and excessive negative adjustments, multi-line rollback, posting-time active-reference checks, canceled-document rejection, and concurrent exactly-once validation.

Local validation completed with Prisma Client generation, TypeScript type checking, ten non-database tests, and a production build. The PostgreSQL-backed workflow test is present but was skipped locally because `TEST_DATABASE_URL` is not configured and no local PostgreSQL/Docker runtime is available.

Developer 1 must treat `INVENTORY_CONFLICT` as retryable and refresh the operation before retrying validation. Developer 3 is needed before adding any richer workflow that changes persistence or shared DTOs, including vendor/customer records, pick/pack states, scheduled or in-transit transfers, physical-count sessions, cancellation audit fields, or reversals.

## Frontend Stack

- React 19
- TypeScript
- Vite
- React Router DOM for client-side routing
- Plain CSS design system using shared custom properties; no component framework

## Frontend Structure

- `src/components/navigation/` → sidebar and header
- `src/components/dashboard/` → dashboard-specific presentation components
- `src/components/ui/` → reusable UI primitives and states
- `src/layouts/` → responsive application shell
- `src/pages/` → route-level dashboard and placeholder pages
- `src/data/` → centralized frontend demo fixtures
- `src/services/` → frontend data integration boundaries
- `src/hooks/` → reusable frontend data-loading state
- `src/types/` → frontend-only inventory view types

## Frontend Routes

| Route | Current UI status |
| --- | --- |
| `/dashboard` | Initial dashboard implemented with demo data |
| `/products` | Product catalogue with search and stock/category filters |
| `/products/new` | Add Product form using the frontend demo service |
| `/products/:id` | Product details and per-location stock view |
| `/products/:id/edit` | Edit Product form using the frontend demo service |
| `/receipts` | Receipt register with reference/status filters and responsive demo records |
| `/deliveries` | Delivery register with reference/status filters and responsive demo records |
| `/transfers` | Internal transfer register with reference/status filters and responsive demo records |
| `/adjustments` | Inventory adjustment register with reference/status filters and responsive demo records |
| `/ledger` | Searchable, filterable, read-only stock movement history |

The root route redirects to `/dashboard`. These are client-side frontend routes; no backend routes are implied.

## Frontend Integration Status

The frontend currently makes no backend API requests. Dashboard, products, inventory operations, and ledger pages use isolated demo adapters while integration with the implemented backend contracts is planned.

For future dashboard integration, the frontend needs an agreed contract providing:

- Aggregate dashboard statistics: products in stock, active SKUs, low-stock count, out-of-stock count, pending receipt count, pending delivery count, expected units, and reserved units
- Stock-status distribution for healthy, low-stock, and out-of-stock products
- Low-stock product display data: product name, SKU, category, unit, quantity, minimum stock, status, warehouse, and location
- Recent stock movement display data: reference, product, SKU, operation type, quantity/unit, timestamp, source, and destination where applicable
- A dashboard last-updated timestamp

The implemented backend contracts are documented below. A dashboard aggregation endpoint has not been defined; the frontend continues to consume demo data through `src/services/dashboardService.ts` until an agreed integration is implemented.

## Backend Status

Implemented foundation:

- Node.js 24 with TypeScript and Express
- PostgreSQL with Prisma 6.12
- Validated environment configuration
- JSON APIs under `/api/v1`
- Centralized success responses and error handling
- Health/database connectivity endpoint
- JWT Bearer authentication architecture with securely hashed passwords
- One central inventory service for every stock change
- Immutable stock movements with transactional per-location balances

Password reset is deferred. Authentication, catalog, warehouse/location, stock query, inventory operation, and ledger APIs are implemented. The schema migration, database connection, full inventory workflow, and compiled server startup were validated against an isolated PostgreSQL 16 database.

## Routes

Public:

- `GET /api/v1/health` — API and database health check
- `POST /api/v1/auth/register` — register a warehouse staff user and receive a Bearer token
- `POST /api/v1/auth/login` — authenticate and receive a Bearer token

Bearer token required:

- `GET /api/v1/auth/me`
- `POST|GET /api/v1/categories`
- `POST|GET /api/v1/products`
- `GET|PATCH|DELETE /api/v1/products/:id` (`DELETE` performs deactivation)
- `POST|GET /api/v1/warehouses`
- `GET|PATCH /api/v1/warehouses/:id`
- `POST /api/v1/warehouses/:id/locations`
- `GET /api/v1/locations`
- `GET|PATCH /api/v1/locations/:id`
- `GET /api/v1/stock`
- `POST|GET /api/v1/{receipts|deliveries|transfers|adjustments}`
- `GET /api/v1/{operation}/:id`
- `POST /api/v1/{operation}/:id/validate`
- `POST /api/v1/{operation}/:id/cancel`
- `GET /api/v1/ledger`

All planned Phase 1 API route groups are implemented.

## APIs

Authentication uses JWT Bearer tokens. Send protected requests with `Authorization: Bearer <accessToken>`. Public registration cannot assign elevated roles. Passwords are hashed with bcrypt and never returned.

Product responses include total stock and per-location balances. Stock is read-only through product and stock routes; these APIs never modify balances. Use SKU/name search and category/status filters on product lists. Use product, location, warehouse, search, and low-stock filters on stock lists.

Inventory operations are two-step: create a `DRAFT`, then call its `/validate` endpoint. Validation is the only action that changes stock. It atomically claims the draft, updates balances through the central inventory service, creates immutable movements, and marks the operation `DONE`. Re-validation is rejected with `OPERATION_ALREADY_PROCESSED`; insufficient delivery/transfer/negative-adjustment stock is rejected with `INSUFFICIENT_STOCK`. Drafts can be canceled without changing stock. Actual request, response, and error contracts are documented below.

## Database

The initial PostgreSQL schema and migration define:

- Users and roles
- Product categories and products
- Warehouses and locations
- One stock balance per product/location
- Unified inventory documents and items for receipts, deliveries, transfers, and adjustments
- Immutable stock movements linked to their originating operation and operator

Database constraints prevent negative balances, invalid movement shapes, duplicate products in one document, and duplicate client references per operation type. The initial migration was successfully applied and tested against an isolated PostgreSQL 16 database. Each developer/deployment still needs a private `DATABASE_URL`; no credentials are committed.

## Shared Frontend Components

- `AppShell`
- `Sidebar`
- `Header`
- `PageHeader`
- `StatCard`
- `StatusBadge`
- `LoadingState`
- `ErrorState`
- `StockOverview`
- `LowStockTable`
- `MovementList`
- `ProductFilters`
- `ProductTable`
- `ProductStatusBadge`
- `ProductEmptyState`
- `ProductForm`

## Frontend Demo Data

Dashboard demo data is centralized in `src/data/dashboardDemoData.ts` and exposed through `src/services/dashboardService.ts`.

Product catalogue demo data is centralized in `src/data/productDemoData.ts` and owned at runtime by the frontend-only adapter in `src/services/productService.ts`. Add/edit changes persist in versioned `sessionStorage` for the current browser tab. Product pages consume the adapter through `src/hooks/useProducts.ts`, `src/hooks/useProduct.ts`, and `src/hooks/useProductEditor.ts`; no fake API endpoint is used.

The frontend product form intentionally does not edit current or initial stock. Stock remains read-only and must eventually use receipt/adjustment workflows so ledger integrity is preserved. The optional product description shown in the demo UI is not present in the current backend product contract and requires team agreement before backend integration.

Inventory operation and ledger demo records are centralized in `src/data/inventoryActivityDemoData.ts` and exposed through `src/services/inventoryActivityService.ts`. The four operation registers and read-only ledger mirror documented operation types, statuses, locations, signed decimal quantities, and filters without making API calls or changing stock.

## Shared Backend Infrastructure

- Environment validation
- Prisma client
- Consistent JSON success/error envelopes
- Centralized error handling
- Security and CORS middleware
- Automated unit, validation, and PostgreSQL-backed integration tests

## Known Limitations

- OTP/password reset is deferred.
- Role-based authorization beyond authenticated access is not implemented; all active users currently have the same API permissions.
- Dashboard KPI aggregation endpoints and real-time push updates are not implemented.
- Vendor and customer master data are outside the current documented scope.
- A PostgreSQL database and private environment configuration must be provisioned for each runtime.

## Architecture Decisions

The approved frontend stack is React + TypeScript + Vite with React Router DOM and a plain CSS design system. Frontend data access remains behind service interfaces. The approved backend stack is Node.js 24 + TypeScript + Express with PostgreSQL, Prisma, and JWT Bearer authentication; detailed backend decisions are recorded in [`.kiro/steering/architecture.md`](.kiro/steering/architecture.md). Read-only Smart Inventory analytics are implemented under `/api/v1/analytics`; frontend integration with those endpoints remains deferred.

## Important Rules

See [`.kiro/steering/team-rules.md`](.kiro/steering/team-rules.md) for the shared development rules all team members and Kiro agents must follow.

## API Contracts

### Conventions

- Base path: `/api/v1`
- Content type: `application/json`
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Success: `{ "success": true, "data": ..., "meta"?: ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }`
- Quantities are decimal strings with three fractional digits in responses. Request quantities accept a number or decimal string with up to three fractional digits.
- List endpoints use `page` (default `1`) and `limit` (default `25`, maximum `100`) and return pagination under `meta.pagination`.
- Common errors: `AUTHENTICATION_REQUIRED` (401), `INVALID_TOKEN` (401), `VALIDATION_ERROR` (422), `INVALID_REFERENCE` (422), `CONFLICT` (409), `ROUTE_NOT_FOUND` (404), and `INTERNAL_ERROR` (500).

### Health and authentication

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Confirm API and database connectivity | None | `{ status, database }` | `INTERNAL_ERROR` if the database is unavailable |
| POST | `/api/v1/auth/register` | Register a warehouse staff user | Body: `{ email, password }`; password is 8–72 UTF-8 bytes | `{ user: { id, email, role, isActive, createdAt }, accessToken }` | `CONFLICT` for duplicate email |
| POST | `/api/v1/auth/login` | Authenticate a user | Body: `{ email, password }` | `{ user, accessToken }` | `INVALID_CREDENTIALS` (401) |
| GET | `/api/v1/auth/me` | Return current authenticated user | Bearer token | `{ user: { id, email, role } }` | Authentication errors |

### Products and categories

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/categories` | Create a product category | Body: `{ name }` | Created category | `CONFLICT` for duplicate name |
| GET | `/api/v1/categories` | List active categories | None | Category array | None |
| POST | `/api/v1/products` | Create a product without directly changing stock | Body: `{ name, sku, categoryId?, unitOfMeasure, reorderLevel? }` | Product with `totalStock` and `stockByLocation` | `CONFLICT` for duplicate SKU; `INVALID_REFERENCE` for category |
| GET | `/api/v1/products` | Search/list products | Query: `page?`, `limit?`, `search?`, `categoryId?`, `isActive?` | Product array + pagination | Validation errors |
| GET | `/api/v1/products/:id` | Get product details and balances | Product UUID in path | Product with location balances | `PRODUCT_NOT_FOUND` (404) |
| PATCH | `/api/v1/products/:id` | Update supplied product fields | Body: any of create fields plus `isActive` | Updated product | `PRODUCT_NOT_FOUND`; conflict/reference errors |
| DELETE | `/api/v1/products/:id` | Deactivate, not physically delete, a product | Product UUID in path | Deactivated product | `PRODUCT_NOT_FOUND` |

Initial stock is intentionally not accepted by the product API; use an adjustment so every stock change has a ledger record.

### Warehouses, locations, and stock

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/warehouses` | Create a warehouse | Body: `{ name }` | Created warehouse | `CONFLICT` for duplicate name |
| GET | `/api/v1/warehouses` | List warehouses and active locations | None | Warehouse array | None |
| GET | `/api/v1/warehouses/:id` | Get warehouse and locations | Warehouse UUID | Warehouse | `WAREHOUSE_NOT_FOUND` (404) |
| PATCH | `/api/v1/warehouses/:id` | Update warehouse name/status | Body: `{ name?, isActive? }` | Updated warehouse | `WAREHOUSE_NOT_FOUND`; `CONFLICT` |
| POST | `/api/v1/warehouses/:id/locations` | Create a location in an active warehouse | Body: `{ name }` | Location with warehouse | `WAREHOUSE_NOT_FOUND`; `CONFLICT` |
| GET | `/api/v1/locations` | List/filter locations | Query: `page?`, `limit?`, `warehouseId?`, `isActive?` | Location array + pagination | Validation errors |
| GET | `/api/v1/locations/:id` | Get a location | Location UUID | Location with warehouse | `LOCATION_NOT_FOUND` (404) |
| PATCH | `/api/v1/locations/:id` | Update location name/status | Body: `{ name?, isActive? }` | Updated location | `LOCATION_NOT_FOUND`; `CONFLICT` |
| GET | `/api/v1/stock` | Read location balances and low-stock status | Query: `page?`, `limit?`, `productId?`, `locationId?`, `warehouseId?`, `search?`, `lowStock?` | Balance array + pagination | Validation errors |

### Inventory operations

All operation endpoints require a Bearer token. Creation produces a `DRAFT` and does not change stock. Validation changes stock once, writes movements, and changes status to `DONE`. Cancellation is allowed only for a draft.

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/receipts` | Create incoming-stock draft | Body: `{ clientReference?, destinationLocationId, items: [{ productId, quantity > 0 }] }` | Receipt operation | `INVALID_PRODUCT`, `INVALID_LOCATION`, `CONFLICT` |
| POST | `/api/v1/deliveries` | Create outgoing-stock draft | Body: `{ clientReference?, sourceLocationId, items: [{ productId, quantity > 0 }] }` | Delivery operation | Same as receipt |
| POST | `/api/v1/transfers` | Create location-transfer draft | Body: `{ clientReference?, sourceLocationId, destinationLocationId, items: [{ productId, quantity > 0 }] }`; locations must differ | Transfer operation | Same as receipt |
| POST | `/api/v1/adjustments` | Create signed stock-adjustment draft | Body: `{ clientReference?, locationId, reason, items: [{ productId, quantity != 0 }] }` | Adjustment operation | Same as receipt |
| GET | `/api/v1/{receipts\|deliveries\|transfers\|adjustments}` | List one operation type | Query: `page?`, `limit?`, `status?` (`DRAFT`, `DONE`, `CANCELED`), `clientReference?` | Operation array + pagination | Validation errors |
| GET | `/api/v1/{operation}/:id` | Get one operation of the route type | Operation UUID | Operation, items, and any movements | `OPERATION_NOT_FOUND` (404) |
| POST | `/api/v1/{operation}/:id/validate` | Apply a draft through the central inventory service | Operation UUID; no body | Completed operation and movements | `OPERATION_NOT_FOUND` (404), `OPERATION_ALREADY_PROCESSED` (409), `INSUFFICIENT_STOCK` (409), `INVENTORY_CONFLICT` (409 with `details.retryable: true`), `INVALID_PRODUCT` (422), `INVALID_LOCATION` (422), `INVALID_OPERATION` (422) |
| POST | `/api/v1/{operation}/:id/cancel` | Cancel a draft without stock changes | Operation UUID; no body | Canceled operation | `OPERATION_NOT_FOUND`, `OPERATION_ALREADY_PROCESSED` |

Operation responses include type, status, optional reference/reason, source/destination locations, creator/validator, timestamps, product items, and movements. Delivery movement quantities are negative; receipt quantities are positive; transfers contain both locations and preserve overall quantity; adjustment movement quantities are signed.

### Stock ledger

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/ledger` | Search immutable stock movement history | Query: `page?`, `limit?`, `type?`, `productId?`, `locationId?`, `warehouseId?`, `documentId?`, `performedById?`, `search?`, `from?`, `to?`; dates are ISO timestamps | Movements with product, source/destination, operation reference, operator, timestamp + pagination | Validation errors |

No create, update, or delete ledger endpoint exists. Movements are written only by successful central inventory-service validation.

### Smart features (analytics) — Developer 4

All analytics endpoints require a Bearer token and are strictly **read-only**: they never create movements or change stock balances. They only aggregate the existing data produced by Developer 2/3's central inventory service. Mounted under `/api/v1/analytics`.

Shared query parameters: `windowDays?` (default `30`, max `365` — how far back movement trends look), `warehouseId?` (scope every insight to one warehouse), `limit?` (default `5`, max `50` — size of each ranked list).

| Method | Path | Purpose | Response data |
| --- | --- | --- | --- |
| GET | `/api/v1/analytics/insights` | Full smart-inventory bundle | `{ window, summary, alerts, analytics }` |
| GET | `/api/v1/analytics/low-stock` | Focused low-stock alert feed | `{ window, summary, alerts }` |
| GET | `/api/v1/analytics/ai-insight` | Human-readable StockSense AI Insight | `{ window, summary, insight }` |

- `summary`: `{ trackedProducts, outOfStock, lowStock, approachingReorder, healthy, attentionRatio }`.
- `alerts`: `{ outOfStock[], lowStock[], approaching[] }`. Each product entry: `{ productId, name, sku, unitOfMeasure, totalQuantity, reorderLevel, status, consumedInWindow, averageDailyConsumption, daysOfCover }`. `status` is `OUT_OF_STOCK | LOW_STOCK | APPROACHING | HEALTHY`. `daysOfCover` is `null` when there is no measured consumption.
- `analytics`: `{ fastMovers[], slowMovers[], reorderAttention[], recentActivity }`. `recentActivity` counts movements by type over the window: `{ RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT }`.
- `insight` (ai-insight only): `{ source: "ai" | "rule-based", headline, messages[] }`.

Classification rules: `OUT_OF_STOCK` = on-hand ≤ 0; `LOW_STOCK` = on-hand ≤ reorder level; `APPROACHING` = on-hand within 25% above reorder level; otherwise `HEALTHY`. A reorder level of 0 is treated as never-low. "Consumption" is the absolute quantity of `DELIVERY` movements in the window (deliveries are stored negative). Fast movers rank by consumption; slow movers are in-stock products with zero consumption; reorder attention ranks actively-consumed products by ascending `daysOfCover`.

## Developer 4 — Smart Features

### Completed

- Read-only Smart Inventory Service (`src/modules/analytics/analytics.service.ts`) aggregating real `StockBalance`, `Product.reorderLevel`, and `StockMovement` data into low-stock detection, alerts, and analytics.
- Low-stock intelligence: out-of-stock / low-stock / approaching-reorder detection with a shared classifier.
- Inventory analytics: fast movers, slow movers, reorder-attention (days-of-cover), and recent movement activity by type.
- StockSense AI Insight layer (`insight-ai.service.ts`): converts the structured bundle into a short human-readable narrative. Uses an optional OpenAI-compatible LLM and always falls back to a deterministic rule-based summary. Strictly read-only; the model is never allowed to change stock.
- Three endpoints under `/api/v1/analytics` (`insights`, `low-stock`, `ai-insight`), mounted behind the shared `authenticate` middleware.
- Unit tests in `tests/analytics-insights.test.ts` (classifier, query schema, rule-based narrative). Typecheck clean; full suite green (integration test still skips without `TEST_DATABASE_URL`).

### In Progress

- None. This task is complete and stops here per scope.

### APIs Used

- Reads Prisma models owned by Developer 3's backend: `StockBalance`, `Product`, `StockMovement`, `Location`, `Warehouse`. Read-only via the shared Prisma client. No existing API or model was modified.

### APIs Needed

- None required to function. The module reads the database directly through the shared Prisma client, consistent with the existing `stock`/`ledger` services. No new backend API or schema change is requested from other developers.

### Data Dependencies

- Insight quality depends on real data volume: `StockMovement` history (especially `DELIVERY` movements) drives consumption, days-of-cover, and fast/slow-mover analytics. With little/no history, alerts still work (based on balances vs reorder level) but trend analytics will be sparse. No numbers are invented.
- `Product.reorderLevel` must be set meaningfully for low-stock/approaching detection to be useful.

### Integration Notes (for Developer 1 — Frontend)

- Recommended dashboard wiring: `GET /api/v1/analytics/insights` for the KPI cards + alert lists, and `GET /api/v1/analytics/ai-insight` for a "StockSense AI Insight" panel. Send `Authorization: Bearer <accessToken>`.
- Keep business logic out of UI components — consume these endpoints directly; all computation lives in the Smart Inventory Service.

### DEPENDENCY (optional, for Developer 3 — deployment/config)

- **What I need:** three optional environment variables — `AI_API_KEY`, `AI_BASE_URL` (default `https://api.openai.com/v1`), `AI_MODEL` (default `gpt-4o-mini`) — added to `src/config/env.ts` as optional.
- **Reason:** enables the LLM-backed narrative for `/api/v1/analytics/ai-insight`.
- **Expected input:** an OpenAI-compatible chat-completions API key/base URL.
- **Expected output:** a short natural-language insight string.
- **Note:** entirely optional. When `AI_API_KEY` is unset the endpoint returns the deterministic rule-based narrative, so nothing breaks without AI configuration. Please add these keys to any shared `.env.example`/deployment config if the team wants live AI at the demo.

### Known Issues

- LLM path is best-effort: on timeout (10s), network error, or non-200 response it silently falls back to the rule-based narrative (by design, for demo reliability). Not yet covered by an automated live-LLM test.
- `buildInsights` loads current balances into memory and aggregates in the service layer (mirrors the existing `stock` service approach). Fine for hackathon-scale data; would need query-side aggregation at large scale.
- Analytics endpoints are not yet exercised by a DB-backed integration test (the shared integration test still requires `TEST_DATABASE_URL`).
