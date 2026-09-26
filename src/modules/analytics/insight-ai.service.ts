import { env } from "../../config/env.js";
import type { InsightBundle } from "./analytics.service.js";

/**
 * StockSense AI Insight layer.
 *
 * STRICTLY READ-ONLY. This layer only turns the structured insight bundle
 * (produced by the Smart Inventory Service from real data) into a short,
 * human-readable narrative. It never modifies stock and never invents numbers —
 * it is only allowed to phrase the figures it is given.
 *
 * Data flow:
 *   Inventory Data -> Structured Context (InsightBundle)
 *      -> AI Service (this file) -> Human-readable Insight -> Frontend
 *
 * If no AI provider is configured, we fall back to a deterministic rule-based
 * narrative. This keeps the feature reliable for a hackathon demo: the endpoint
 * always returns a sensible insight, with or without an LLM.
 */

export interface InsightNarrative {
  source: "ai" | "rule-based";
  headline: string;
  messages: string[];
}

/**
 * Build a compact, factual context object for an LLM. Only the fields needed to
 * phrase an insight are included; no raw balances or identifiers beyond names.
 */
function toModelContext(bundle: InsightBundle) {
  return {
    windowDays: bundle.window.days,
    summary: bundle.summary,
    outOfStock: bundle.alerts.outOfStock.map((p) => p.name),
    lowStock: bundle.alerts.lowStock.map((p) => ({ name: p.name, onHand: p.totalQuantity })),
    approaching: bundle.alerts.approaching.map((p) => ({
      name: p.name,
      onHand: p.totalQuantity,
      reorderLevel: p.reorderLevel,
      daysOfCover: p.daysOfCover,
    })),
    reorderAttention: bundle.analytics.reorderAttention.map((p) => ({
      name: p.name,
      daysOfCover: p.daysOfCover,
      averageDailyConsumption: p.averageDailyConsumption,
    })),
    fastMovers: bundle.analytics.fastMovers.map((p) => ({
      name: p.name,
      consumed: p.consumedInWindow,
    })),
  };
}

/**
 * Deterministic narrative used when no LLM is configured, or as a safe fallback
 * if the LLM call fails. Every sentence is derived from the real bundle.
 */
export function ruleBasedNarrative(bundle: InsightBundle): InsightNarrative {
  const messages: string[] = [];
  const { summary } = bundle;

  if (summary.trackedProducts === 0) {
    return {
      source: "rule-based",
      headline: "No stock is being tracked yet.",
      messages: ["Add products and record stock movements to unlock insights."],
    };
  }

  if (summary.outOfStock > 0) {
    const names = bundle.alerts.outOfStock.slice(0, 3).map((p) => p.name).join(", ");
    messages.push(
      `${summary.outOfStock} product(s) are out of stock${names ? ` (${names})` : ""}. These need immediate replenishment.`,
    );
  }

  if (summary.lowStock > 0) {
    const names = bundle.alerts.lowStock.slice(0, 3).map((p) => p.name).join(", ");
    messages.push(
      `${summary.lowStock} product(s) are at or below their reorder level${names ? ` (${names})` : ""}.`,
    );
  }

  if (summary.approachingReorder > 0) {
    const item = bundle.alerts.approaching[0];
    if (item) {
      const cover = item.daysOfCover ? ` about ${item.daysOfCover} days of cover remain` : "";
      messages.push(
        `${item.name} is approaching its low-stock threshold (${item.totalQuantity} on hand vs reorder level ${item.reorderLevel}).${cover ? `${cover}. Consider reviewing the next replenishment.` : ""}`,
      );
    }
  }

  const urgent = bundle.analytics.reorderAttention[0];
  if (urgent && urgent.daysOfCover) {
    messages.push(
      `${urgent.name} has the least cover of actively consumed items — roughly ${urgent.daysOfCover} days at the recent consumption rate.`,
    );
  }

  const topMover = bundle.analytics.fastMovers[0];
  if (topMover) {
    messages.push(
      `${topMover.name} is the fastest mover over the last ${bundle.window.days} days (${topMover.consumedInWindow} ${topMover.unitOfMeasure} delivered).`,
    );
  }

  if (bundle.analytics.slowMovers.length > 0) {
    const names = bundle.analytics.slowMovers.slice(0, 3).map((p) => p.name).join(", ");
    messages.push(`Slow-moving stock with no recent deliveries: ${names}.`);
  }

  if (messages.length === 0) {
    messages.push("Inventory looks healthy — no products need attention right now.");
  }

  const headline =
    summary.outOfStock > 0 || summary.lowStock > 0
      ? "Some products need attention."
      : summary.approachingReorder > 0
        ? "A few products are approaching their reorder level."
        : "Inventory is healthy.";

  return { source: "rule-based", headline, messages };
}

/**
 * Call the configured OpenAI-compatible chat completions endpoint to phrase the
 * insight. Returns null on any failure so the caller can fall back safely.
 *
 * The model is explicitly instructed to only use the provided figures and to
 * never recommend direct stock changes — insight is advisory only.
 */
async function llmNarrative(bundle: InsightBundle): Promise<InsightNarrative | null> {
  const apiKey = env.AI_API_KEY;
  if (!apiKey) return null;

  const context = toModelContext(bundle);
  const system =
    "You are StockSense AI, a read-only inventory analyst. Using ONLY the JSON figures provided, write a concise, professional inventory insight of 2-4 short sentences. Never invent products or numbers. Never instruct anyone to directly edit stock; only suggest reviewing replenishment or attention. Do not use markdown.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(context) },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const messages = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      source: "ai",
      headline: bundle.summary.outOfStock > 0 || bundle.summary.lowStock > 0
        ? "Some products need attention."
        : "Inventory insight",
      messages: messages.length > 0 ? messages : [text],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Produce a human-readable narrative for the given insight bundle.
 * Tries the LLM when configured; always falls back to the deterministic
 * narrative so the endpoint is reliable.
 */
export async function narrateInsights(bundle: InsightBundle): Promise<InsightNarrative> {
  const ai = await llmNarrative(bundle);
  return ai ?? ruleBasedNarrative(bundle);
}
