# StockSense

StockSense is a modular Inventory Management System (IMS) for digitizing and streamlining stock-related operations within a business. It is intended to serve as a single, real-time source of truth for products, warehouses, and every stock movement that passes through them.

## Problem

Many businesses still track inventory across manual registers, Excel sheets, and other scattered tools. That approach makes stock levels hard to trust, slows down day-to-day warehouse work, and hides mistakes until they become expensive.

StockSense addresses this by:

- Replacing manual registers, Excel sheets, and scattered stock tracking with one system.
- Providing centralized inventory management across products, categories, warehouses, and locations.
- Providing real-time visibility of stock operations, so incoming, outgoing, and internal movements are always reflected in current stock figures.

## Target Users

- **Inventory Managers** — manage incoming and outgoing stock.
- **Warehouse Staff** — perform transfers, picking, shelving, and counting.

## Core Features

The following features define the intended scope of StockSense.

- **Authentication** — user signup and login, OTP-based password reset, and redirection to the inventory dashboard after sign-in.
- **Inventory Dashboard** — a snapshot of inventory operations with KPIs and dynamic filters by document type, status, warehouse or location, and product category.
- **Product Management** — create and update products with name, SKU / code, category, unit of measure, and optional initial stock. Includes product categories, stock availability per location, and reordering rules.
- **Receipts / Incoming Stock** — record goods arriving from vendors; validating a receipt increases stock.
- **Delivery Orders / Outgoing Stock** — pick and pack items leaving the warehouse; validating a delivery decreases stock.
- **Internal Transfers** — move stock between warehouses and locations without changing total quantity on hand.
- **Inventory Adjustments** — reconcile recorded stock against physical counts and log the correction.
- **Stock Ledger / Movement History** — a log of every stock movement across receipts, deliveries, transfers, and adjustments.
- **Low-stock Alerts** — notify when items fall to low stock or go out of stock.
- **Multi-warehouse Support** — manage stock across multiple warehouses and locations.
- **SKU Search and Smart Filters** — locate products and documents quickly by SKU and filter criteria.

## Inventory Flow

```
Vendor
  → Receipt
    → Stock
      → Internal Transfer
        → Location Change
          → Delivery
            → Stock Reduction
              → Adjustment
                → Stock Ledger
```

Every step in this flow is recorded in the stock ledger.

## Dashboard

The dashboard surfaces these key performance indicators:

- Total Products in Stock
- Low Stock / Out of Stock
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

## Technology Stack

To be finalized by the team.

## Team

| Member | Area |
| --- | --- |
| Developer 1 | Frontend |
| Developer 2 | Inventory Operations |
| Developer 3 | Backend / Database / Authentication |
| Developer 4 | AI / Smart Features |

## Development

This project is being developed collaboratively using GitHub and Kiro.

## Project Status

Initial project setup.
