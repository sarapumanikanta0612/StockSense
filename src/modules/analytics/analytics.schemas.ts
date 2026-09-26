import { z } from "zod";

/**
 * Query schema for the smart-features endpoints.
 *
 * `windowDays` bounds how far back movement-trend analysis looks. It is capped
 * so a single request can never scan an unbounded amount of ledger history.
 * `warehouseId` optionally scopes every insight to one warehouse.
 * `limit` bounds the size of each ranked list (fast/slow movers, reorder attention).
 */
export const analyticsQuerySchema = z.object({
  windowDays: z.coerce.number().int().positive().max(365).default(30),
  warehouseId: z.uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(5),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
