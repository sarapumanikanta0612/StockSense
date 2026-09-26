# StockSense Architecture

## Current State

The React/Vite frontend foundation and Node/Express backend foundation are implemented and are being integrated. AI architecture is not defined.

## Frontend

React + TypeScript + Vite. React Router DOM provides client-side routing, and the initial UI uses a plain CSS design system. Frontend demo data is isolated behind a service boundary until shared API contracts are agreed.

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

Frontend client routes and implemented backend API routes are documented in `TEAM_CONTEXT.md`. Frontend client routes do not imply backend endpoints; backend JSON APIs use the `/api/v1` prefix.

## Integration Rules

All shared interfaces must be documented before other developers depend on them. API modules must not update stock balances directly; all stock-changing operations must call the central inventory service.
