import { StockMovementType } from "@prisma/client";
import { z } from "zod";
import { paginationSchema } from "../../lib/validation.js";

export const ledgerListQuerySchema = paginationSchema
  .extend({
    type: z.nativeEnum(StockMovementType).optional(),
    productId: z.uuid().optional(),
    locationId: z.uuid().optional(),
    warehouseId: z.uuid().optional(),
    documentId: z.uuid().optional(),
    performedById: z.uuid().optional(),
    search: z.string().trim().max(150).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to), {
    message: "from must not be later than to",
    path: ["from"],
  });
