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

The frontend foundation and initial dashboard UI are implemented on the `frontend` branch. The backend foundation, authentication, catalog, warehouse/location, inventory operations, stock query, and ledger APIs are implemented and validated from the `backend` work now present on `main`. AI features are not implemented.

## Current Work

- Developer 1: React frontend foundation, application shell, dashboard UI, and complete frontend-only Product Management experience implemented
- Developer 2: Not started
- Developer 3: Backend foundation complete — ready for team integration
- Developer 4: Not started

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
| `/receipts` | Placeholder |
| `/deliveries` | Placeholder |
| `/transfers` | Placeholder |
| `/adjustments` | Placeholder |
| `/ledger` | Placeholder |

The root route redirects to `/dashboard`. These are client-side frontend routes; no backend routes are implied.

## Frontend Integration Status

The frontend currently makes no backend API requests. Dashboard and product pages use isolated demo adapters while integration with the implemented backend contracts is planned.

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

The approved frontend stack is React + TypeScript + Vite with React Router DOM and a plain CSS design system. Frontend data access remains behind service interfaces. The approved backend stack is Node.js 24 + TypeScript + Express with PostgreSQL, Prisma, and JWT Bearer authentication; detailed backend decisions are recorded in [`.kiro/steering/architecture.md`](.kiro/steering/architecture.md). Dashboard aggregation and AI architecture remain undecided.

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
| POST | `/api/v1/{operation}/:id/validate` | Apply a draft through the central inventory service | Operation UUID; no body | Completed operation and movements | `OPERATION_NOT_FOUND`, `OPERATION_ALREADY_PROCESSED` (409), `INSUFFICIENT_STOCK` (409), `INVALID_OPERATION` (422) |
| POST | `/api/v1/{operation}/:id/cancel` | Cancel a draft without stock changes | Operation UUID; no body | Canceled operation | `OPERATION_NOT_FOUND`, `OPERATION_ALREADY_PROCESSED` |

Operation responses include type, status, optional reference/reason, source/destination locations, creator/validator, timestamps, product items, and movements. Delivery movement quantities are negative; receipt quantities are positive; transfers contain both locations and preserve overall quantity; adjustment movement quantities are signed.

### Stock ledger

| Method | Path | Purpose | Request | Response data | Additional errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/ledger` | Search immutable stock movement history | Query: `page?`, `limit?`, `type?`, `productId?`, `locationId?`, `warehouseId?`, `documentId?`, `performedById?`, `search?`, `from?`, `to?`; dates are ISO timestamps | Movements with product, source/destination, operation reference, operator, timestamp + pagination | Validation errors |

No create, update, or delete ledger endpoint exists. Movements are written only by successful central inventory-service validation.
