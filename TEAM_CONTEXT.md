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

The frontend foundation and initial dashboard UI are implemented on the `frontend` branch. Backend, database, authentication, inventory business logic, and AI implementation are outside this frontend work and are not assumed to be complete.

## Current Work

- Developer 1: React frontend foundation, application shell, navigation, dashboard UI, and workflow placeholders implemented
- Developer 2: Not started
- Developer 3: Not started
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
| `/products` | Placeholder |
| `/receipts` | Placeholder |
| `/deliveries` | Placeholder |
| `/transfers` | Placeholder |
| `/adjustments` | Placeholder |
| `/ledger` | Placeholder |

The root route redirects to `/dashboard`. These are client-side frontend routes; no backend routes are implied.

## APIs

No API endpoints or backend behavior have been defined by the frontend.

For future dashboard integration, the frontend needs an agreed contract providing:

- Aggregate dashboard statistics: products in stock, active SKUs, low-stock count, out-of-stock count, pending receipt count, pending delivery count, expected units, and reserved units
- Stock-status distribution for healthy, low-stock, and out-of-stock products
- Low-stock product display data: product name, SKU, category, unit, quantity, minimum stock, status, warehouse, and location
- Recent stock movement display data: reference, product, SKU, operation type, quantity/unit, timestamp, source, and destination where applicable
- A dashboard last-updated timestamp

Endpoint paths, transport details, authentication, and stock calculations remain to be agreed with the responsible developers. Frontend components consume this information through `src/services/dashboardService.ts`.

## Database

Not implemented yet.

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

## Frontend Demo Data

Dashboard demo data is centralized in `src/data/dashboardDemoData.ts`. It is exposed to the UI through the frontend-only adapter in `src/services/dashboardService.ts` and does not call or represent a fake backend API.

## Architecture Decisions

The approved frontend stack is React + TypeScript + Vite. Frontend data access is kept behind service interfaces so demo fixtures can be replaced after backend contracts are agreed. No backend, database, authentication, inventory-logic, or AI architecture decision was made by this frontend work.

## Important Rules

See [`.kiro/steering/team-rules.md`](.kiro/steering/team-rules.md) for the shared development rules all team members and Kiro agents must follow.
