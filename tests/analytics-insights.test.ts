import { Prisma } from "@prisma/client";
import assert from "node:assert/strict";
import test from "node:test";

// Match the repo convention (see auth-crypto.test.ts): set the required
// environment before importing modules that load config, then dynamically
// import. These tests exercise pure logic and never touch the database.
process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/stocksense_test";
process.env["JWT_SECRET"] = "test-only-secret-with-at-least-32-characters";

const { classify } = await import("../src/modules/analytics/analytics.service.js");
const { analyticsQuerySchema } = await import("../src/modules/analytics/analytics.schemas.js");
const { ruleBasedNarrative } = await import("../src/modules/analytics/insight-ai.service.js");
type InsightBundle = Awaited<
  ReturnType<typeof import("../src/modules/analytics/analytics.service.js").buildInsights>
>;

const dec = (value: string | number) => new Prisma.Decimal(value);

test("classify flags out-of-stock when nothing is on hand", () => {
  assert.equal(classify(dec(0), dec(10)), "OUT_OF_STOCK");
  assert.equal(classify(dec("-0.001"), dec(10)), "OUT_OF_STOCK");
});

test("classify flags low-stock at or below reorder level", () => {
  assert.equal(classify(dec(10), dec(10)), "LOW_STOCK");
  assert.equal(classify(dec(5), dec(10)), "LOW_STOCK");
});

test("classify flags approaching within 25% above reorder level", () => {
  // reorder 10 -> approaching ceiling 12.5
  assert.equal(classify(dec(12), dec(10)), "APPROACHING");
  assert.equal(classify(dec("12.5"), dec(10)), "APPROACHING");
});

test("classify reports healthy well above reorder level", () => {
  assert.equal(classify(dec(20), dec(10)), "HEALTHY");
});

test("classify treats zero reorder level as never low", () => {
  assert.equal(classify(dec(1), dec(0)), "HEALTHY");
  assert.equal(classify(dec(0), dec(0)), "OUT_OF_STOCK");
});

test("analyticsQuerySchema applies defaults and caps windowDays", () => {
  const parsed = analyticsQuerySchema.parse({});
  assert.equal(parsed.windowDays, 30);
  assert.equal(parsed.limit, 5);
  assert.equal(analyticsQuerySchema.safeParse({ windowDays: 999 }).success, false);
});

function emptyBundle(overrides: Partial<InsightBundle> = {}): InsightBundle {
  const base: InsightBundle = {
    window: { days: 30, warehouseId: null },
    summary: {
      trackedProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      approachingReorder: 0,
      healthy: 0,
      attentionRatio: "0.00",
    },
    alerts: { outOfStock: [], lowStock: [], approaching: [] },
    analytics: {
      fastMovers: [],
      slowMovers: [],
      reorderAttention: [],
      recentActivity: { RECEIPT: 0, DELIVERY: 0, TRANSFER: 0, ADJUSTMENT: 0 },
    },
  };
  return { ...base, ...overrides };
}

test("rule-based narrative handles an empty catalog", () => {
  const narrative = ruleBasedNarrative(emptyBundle());
  assert.equal(narrative.source, "rule-based");
  assert.match(narrative.headline, /No stock/i);
});

test("rule-based narrative reports healthy inventory", () => {
  const narrative = ruleBasedNarrative(
    emptyBundle({
      summary: {
        trackedProducts: 5,
        outOfStock: 0,
        lowStock: 0,
        approachingReorder: 0,
        healthy: 5,
        attentionRatio: "0.00",
      },
    }),
  );
  assert.equal(narrative.source, "rule-based");
  assert.match(narrative.headline, /healthy/i);
});

test("rule-based narrative surfaces low-stock products by name", () => {
  const narrative = ruleBasedNarrative(
    emptyBundle({
      summary: {
        trackedProducts: 3,
        outOfStock: 0,
        lowStock: 1,
        approachingReorder: 0,
        healthy: 2,
        attentionRatio: "0.33",
      },
      alerts: {
        outOfStock: [],
        lowStock: [
          {
            productId: "p1",
            name: "Steel Rods",
            sku: "SR-1",
            unitOfMeasure: "unit",
            totalQuantity: "5.000",
            reorderLevel: "10.000",
            status: "LOW_STOCK",
            consumedInWindow: "0.000",
            averageDailyConsumption: "0.000",
            daysOfCover: null,
          },
        ],
        approaching: [],
      },
    }),
  );
  assert.match(narrative.headline, /attention/i);
  assert.ok(narrative.messages.some((m) => m.includes("Steel Rods")));
});
