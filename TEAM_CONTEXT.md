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

Password reset is deferred. Inventory and authentication APIs are still in progress.

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

Inventory operation and ledger routes are still in progress.

## APIs

Authentication uses JWT Bearer tokens. Send protected requests with `Authorization: Bearer <accessToken>`. Public registration cannot assign elevated roles. Passwords are hashed with bcrypt and never returned.

Product responses include total stock and per-location balances. Stock is read-only through product and stock routes; these APIs never modify balances. Use SKU/name search and category/status filters on product lists. Use product, location, warehouse, search, and low-stock filters on stock lists. Full request/response/error contracts will be recorded after all backend APIs are validated.

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
