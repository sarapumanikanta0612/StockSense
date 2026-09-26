import { Router } from "express";
import { sendSuccess } from "../../lib/response.js";
import { analyticsQuerySchema } from "./analytics.schemas.js";
import { buildInsights } from "./analytics.service.js";
import { narrateInsights, ruleBasedNarrative } from "./insight-ai.service.js";

/**
 * Smart-features (analytics) router. Mounted under /api/v1/analytics behind the
 * shared `authenticate` middleware in app.ts. Every endpoint is read-only.
 */
export const analyticsRouter = Router();

/**
 * GET /api/v1/analytics/insights
 * Structured low-stock intelligence and inventory analytics derived from real
 * stock balances and movements.
 */
analyticsRouter.get("/insights", async (request, response) => {
  const query = analyticsQuerySchema.parse(request.query);
  const bundle = await buildInsights(query);
  sendSuccess(response, bundle);
});

/**
 * GET /api/v1/analytics/low-stock
 * Focused low-stock alert feed: out-of-stock, low-stock, and approaching lists
 * plus the summary counts. Convenience view over the insight bundle.
 */
analyticsRouter.get("/low-stock", async (request, response) => {
  const query = analyticsQuerySchema.parse(request.query);
  const bundle = await buildInsights(query);
  sendSuccess(response, {
    window: bundle.window,
    summary: bundle.summary,
    alerts: bundle.alerts,
  });
});

/**
 * GET /api/v1/analytics/ai-insight
 * StockSense AI Insight: a short human-readable narrative built from the same
 * structured data. Uses the configured LLM when available, otherwise a
 * deterministic rule-based summary. Always read-only.
 */
analyticsRouter.get("/ai-insight", async (request, response) => {
  const query = analyticsQuerySchema.parse(request.query);
  const bundle = await buildInsights(query);
  const narrative = await narrateInsights(bundle);
  sendSuccess(response, {
    window: bundle.window,
    summary: bundle.summary,
    insight: narrative,
  });
});

// Exported for testing the deterministic path without a live database call.
export { ruleBasedNarrative };
