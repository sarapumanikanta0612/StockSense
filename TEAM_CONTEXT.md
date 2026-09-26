# StockSense Team Context

## Project

StockSense is an Inventory Management System for centralizing stock management and providing real-time visibility into inventory operations.

## Team

- Developer 1 → Frontend / UI
- Developer 2 → Inventory Operations
- Developer 3 → Backend / Database / Authentication
- Developer 4 → AI / Smart Features

## Current Status

Initial setup completed.

README created.

Backend foundation is in progress on the `backend` branch. Frontend and AI features have not been implemented.

## Current Work

- Developer 1: Not started
- Developer 2: Not started
- Developer 3: In progress — backend foundation
- Developer 4: Not started

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

Password reset is deferred. Authentication, catalog, warehouse/location, stock query, and inventory operation APIs are implemented. Database-backed integration validation still requires a local `DATABASE_URL`.

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

Inventory operations are two-step: create a `DRAFT`, then call its `/validate` endpoint. Validation is the only action that changes stock. It atomically claims the draft, updates balances through the central inventory service, creates immutable movements, and marks the operation `DONE`. Re-validation is rejected with `OPERATION_ALREADY_PROCESSED`; insufficient delivery/transfer/negative-adjustment stock is rejected with `INSUFFICIENT_STOCK`. Drafts can be canceled without changing stock. Full request/response/error contracts will be recorded after all backend APIs are validated.

## Database

The initial PostgreSQL schema and migration define:

- Users and roles
- Product categories and products
- Warehouses and locations
- One stock balance per product/location
- Unified inventory documents and items for receipts, deliveries, transfers, and adjustments
- Immutable stock movements linked to their originating operation and operator

Database constraints prevent negative balances, invalid movement shapes, duplicate products in one document, and duplicate client references per operation type. The migration has not been applied locally because database credentials have not been provided.

## Shared Components

- Environment validation
- Prisma client
- Consistent JSON success/error envelopes
- Centralized error handling
- Security and CORS middleware

## Architecture Decisions

Approved backend decisions are documented in [`.kiro/steering/architecture.md`](.kiro/steering/architecture.md). Frontend and AI architecture remain team decisions.

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
