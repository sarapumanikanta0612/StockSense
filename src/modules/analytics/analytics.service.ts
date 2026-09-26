import { Prisma } from "@prisma/client";
import { decimalToString } from "../../lib/decimal.js";
import { prisma } from "../../lib/prisma.js";
import type { AnalyticsQuery } from "./analytics.schemas.js";

/**
 * Smart Inventory Service.
 *
 * This module is READ-ONLY. It never changes stock balances or writes
 * movements — all stock changes must continue to flow through the central
 * inventory service (Developer 2/3). Here we only aggregate the real data
 * produced by that system into insights, alerts, and analytics.
 *
 * Data flow:
 *   StockBalance + Product.reorderLevel + StockMovement
 *      -> Smart Inventory Service (this file)
 *      -> Insights / Alerts (structured JSON)
 *      -> Frontend / AI layer
 */

const ZERO = new Prisma.Decimal(0);

/** How a product's on-hand quantity relates to its reorder level. */
type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "APPROACHING" | "HEALTHY";

interface ProductAggregate {
  productId: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  reorderLevel: Prisma.Decimal;
  totalQuantity: Prisma.Decimal;
}

/**
 * Classify a product's stock health.
 *
 * - OUT_OF_STOCK: nothing on hand.
 * - LOW_STOCK: at or below the reorder level (matches the existing
 *   `lowStock` semantics used by the stock API).
 * - APPROACHING: within 25% above the reorder level — early warning.
 * - HEALTHY: comfortably above the reorder level.
 *
 * Products with a reorder level of 0 can never be "low" by definition, so they
 * are only ever OUT_OF_STOCK or HEALTHY.
 */
export function classify(total: Prisma.Decimal, reorderLevel: Prisma.Decimal): StockStatus {
  if (total.lessThanOrEqualTo(ZERO)) return "OUT_OF_STOCK";
  if (reorderLevel.lessThanOrEqualTo(ZERO)) return "HEALTHY";
  if (total.lessThanOrEqualTo(reorderLevel)) return "LOW_STOCK";
  // Approaching = within 25% above the reorder threshold.
  const approachingCeiling = reorderLevel.times(1.25);
  if (total.lessThanOrEqualTo(approachingCeiling)) return "APPROACHING";
  return "HEALTHY";
}

/**
 * Sum current on-hand quantity per product, optionally scoped to one warehouse.
 * Only active products are considered so deactivated catalog entries do not
 * pollute the insights.
 */
async function loadProductAggregates(warehouseId?: string): Promise<ProductAggregate[]> {
  const balanceWhere: Prisma.StockBalanceWhereInput = {
    product: { isActive: true },
    ...(warehouseId ? { location: { warehouseId } } : {}),
  };

  const balances = await prisma.stockBalance.findMany({
    where: balanceWhere,
    include: {
      product: { select: { id: true, name: true, sku: true, unitOfMeasure: true, reorderLevel: true } },
    },
  });

  const byProduct = new Map<string, ProductAggregate>();
  for (const balance of balances) {
    const existing = byProduct.get(balance.productId);
    if (existing) {
      existing.totalQuantity = existing.totalQuantity.plus(balance.quantity);
    } else {
      byProduct.set(balance.productId, {
        productId: balance.product.id,
        name: balance.product.name,
        sku: balance.product.sku,
        unitOfMeasure: balance.product.unitOfMeasure,
        reorderLevel: balance.product.reorderLevel,
        totalQuantity: balance.quantity,
      });
    }
  }

  return [...byProduct.values()];
}

/**
 * Measure consumption (delivered quantity) per product over the window.
 * DELIVERY movements are stored with negative quantities, so we take the
 * absolute value to express "units consumed". This drives fast/slow-mover
 * ranking and the "days of cover" reorder signal.
 */
async function loadConsumption(
  windowDays: number,
  warehouseId?: string,
): Promise<Map<string, Prisma.Decimal>> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const movementWhere: Prisma.StockMovementWhereInput = {
    type: "DELIVERY",
    createdAt: { gte: since },
    product: { isActive: true },
    ...(warehouseId ? { sourceLocation: { warehouseId } } : {}),
  };

  const movements = await prisma.stockMovement.findMany({
    where: movementWhere,
    select: { productId: true, quantity: true },
  });

  const consumption = new Map<string, Prisma.Decimal>();
  for (const movement of movements) {
    const magnitude = movement.quantity.abs();
    const current = consumption.get(movement.productId) ?? ZERO;
    consumption.set(movement.productId, current.plus(magnitude));
  }
  return consumption;
}

/**
 * Count stock movements per type over the window to describe recent activity.
 */
async function loadMovementActivity(windowDays: number, warehouseId?: string) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const where: Prisma.StockMovementWhereInput = {
    createdAt: { gte: since },
    ...(warehouseId
      ? {
          OR: [
            { sourceLocation: { warehouseId } },
            { destinationLocation: { warehouseId } },
          ],
        }
      : {}),
  };

  const grouped = await prisma.stockMovement.groupBy({
    by: ["type"],
    where,
    _count: { _all: true },
  });

  const counts = { RECEIPT: 0, DELIVERY: 0, TRANSFER: 0, ADJUSTMENT: 0 };
  for (const row of grouped) {
    counts[row.type] = row._count._all;
  }
  return counts;
}

/** Round a Decimal ratio to a fixed number of places for stable JSON output. */
function ratioToString(value: Prisma.Decimal, places = 2): string {
  return value.toFixed(places);
}

/**
 * Produce the full smart-inventory insight bundle from real inventory data.
 * Everything returned here is derived — no numbers are invented.
 */
export async function buildInsights(query: AnalyticsQuery) {
  const { windowDays, warehouseId, limit } = query;

  const [aggregates, consumption, activity] = await Promise.all([
    loadProductAggregates(warehouseId),
    loadConsumption(windowDays, warehouseId),
    loadMovementActivity(windowDays, warehouseId),
  ]);

  const enriched = aggregates.map((aggregate) => {
    const consumed = consumption.get(aggregate.productId) ?? ZERO;
    const status = classify(aggregate.totalQuantity, aggregate.reorderLevel);
    // Average daily consumption over the window.
    const dailyRate = consumed.dividedBy(windowDays);
    // Days of cover: how long current stock lasts at the recent consumption rate.
    // Null when there is no measured consumption (cannot divide by zero).
    const daysOfCover = dailyRate.greaterThan(ZERO)
      ? aggregate.totalQuantity.dividedBy(dailyRate)
      : null;

    return {
      productId: aggregate.productId,
      name: aggregate.name,
      sku: aggregate.sku,
      unitOfMeasure: aggregate.unitOfMeasure,
      totalQuantity: decimalToString(aggregate.totalQuantity),
      reorderLevel: decimalToString(aggregate.reorderLevel),
      status,
      consumedInWindow: decimalToString(consumed),
      averageDailyConsumption: dailyRate.toFixed(3),
      daysOfCover: daysOfCover ? daysOfCover.toFixed(1) : null,
      _totalQuantity: aggregate.totalQuantity,
      _consumed: consumed,
      _daysOfCover: daysOfCover,
    };
  });

  const publicView = (item: (typeof enriched)[number]) => {
    const { _totalQuantity, _consumed, _daysOfCover, ...rest } = item;
    void _totalQuantity;
    void _consumed;
    void _daysOfCover;
    return rest;
  };

  const outOfStock = enriched.filter((item) => item.status === "OUT_OF_STOCK").map(publicView);
  const lowStock = enriched.filter((item) => item.status === "LOW_STOCK").map(publicView);
  const approaching = enriched.filter((item) => item.status === "APPROACHING").map(publicView);

  // Fast movers: highest consumption in the window.
  const fastMovers = [...enriched]
    .filter((item) => item._consumed.greaterThan(ZERO))
    .sort((a, b) => b._consumed.comparedTo(a._consumed))
    .slice(0, limit)
    .map(publicView);

  // Slow movers: products that still have stock but saw no consumption.
  const slowMovers = [...enriched]
    .filter((item) => item._consumed.equals(ZERO) && item._totalQuantity.greaterThan(ZERO))
    .sort((a, b) => b._totalQuantity.comparedTo(a._totalQuantity))
    .slice(0, limit)
    .map(publicView);

  // Reorder attention: products actively consumed with the least cover remaining.
  // These are the strongest "review replenishment" candidates.
  const reorderAttention = [...enriched]
    .filter((item) => item._daysOfCover !== null && item.status !== "OUT_OF_STOCK")
    .sort((a, b) => (a._daysOfCover as Prisma.Decimal).comparedTo(b._daysOfCover as Prisma.Decimal))
    .slice(0, limit)
    .map(publicView);

  const totalTracked = enriched.length;
  const healthyCount = enriched.filter((item) => item.status === "HEALTHY").length;
  const attentionRatio =
    totalTracked > 0
      ? ratioToString(new Prisma.Decimal(totalTracked - healthyCount).dividedBy(totalTracked))
      : "0.00";

  return {
    window: { days: windowDays, warehouseId: warehouseId ?? null },
    summary: {
      trackedProducts: totalTracked,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      approachingReorder: approaching.length,
      healthy: healthyCount,
      attentionRatio,
    },
    alerts: {
      outOfStock,
      lowStock,
      approaching,
    },
    analytics: {
      fastMovers,
      slowMovers,
      reorderAttention,
      recentActivity: activity,
    },
  };
}

export type InsightBundle = Awaited<ReturnType<typeof buildInsights>>;
