import { InventoryDocumentStatus } from "@prisma/client";
import { z } from "zod";
import { decimalInput, paginationSchema } from "../../lib/validation.js";

const clientReference = z.string().trim().min(1).max(120).optional();
const positiveItem = z.object({
  productId: z.uuid(),
  quantity: decimalInput({ positive: true }),
});
const adjustmentItem = z.object({
  productId: z.uuid(),
  quantity: decimalInput({ nonzero: true }),
});

function uniqueProducts<T extends { productId: string }>(items: T[]): boolean {
  return new Set(items.map((item) => item.productId)).size === items.length;
}

const positiveItems = z
  .array(positiveItem)
  .min(1)
  .max(100)
  .refine(uniqueProducts, { message: "Each product may appear only once per operation" });
const adjustmentItems = z
  .array(adjustmentItem)
  .min(1)
  .max(100)
  .refine(uniqueProducts, { message: "Each product may appear only once per operation" });

export const receiptSchema = z.object({
  clientReference,
  destinationLocationId: z.uuid(),
  items: positiveItems,
});

export const deliverySchema = z.object({
  clientReference,
  sourceLocationId: z.uuid(),
  items: positiveItems,
});

export const transferSchema = z
  .object({
    clientReference,
    sourceLocationId: z.uuid(),
    destinationLocationId: z.uuid(),
    items: positiveItems,
  })
  .refine((value) => value.sourceLocationId !== value.destinationLocationId, {
    message: "Source and destination locations must differ",
    path: ["destinationLocationId"],
  });

export const adjustmentSchema = z.object({
  clientReference,
  locationId: z.uuid(),
  reason: z.string().trim().min(1).max(500),
  items: adjustmentItems,
});

export const operationListQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(InventoryDocumentStatus).optional(),
  clientReference: z.string().trim().max(120).optional(),
});
