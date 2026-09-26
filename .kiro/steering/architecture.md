# StockSense Architecture

## Current State

Backend foundation implementation is in progress on the `backend` branch. Frontend and AI architecture are not defined here.

## Frontend

Not decided.

## Backend

- Runtime: Node.js 24 with TypeScript
- HTTP framework: Express
- API convention: JSON APIs under `/api/v1`
- Shared concerns: environment-based configuration, consistent responses, and centralized error handling

## Database

- Database: PostgreSQL
- ORM and migrations: Prisma
- Stock design: immutable stock movements with transactional per-location balances

## Authentication

JWT Bearer tokens with securely hashed passwords. Registration, login, and protected API access are the initial scope. Password reset is deferred.

## Inventory Logic

One central inventory service is the only component allowed to change stock. Receipts, deliveries, internal transfers, and adjustments must use this service.

## Stock Ledger

Stock movements are immutable records created in the same database transaction as operation and location-balance changes.

## API Structure

JSON endpoints use the `/api/v1` prefix. Actual endpoint contracts must be documented in `TEAM_CONTEXT.md` as they become available.

## Routes

Backend routes are being implemented. Frontend routes are not decided.

## Integration Rules

All shared interfaces must be documented before other developers depend on them. API modules must not update stock balances directly; all stock-changing operations must call the central inventory service.
