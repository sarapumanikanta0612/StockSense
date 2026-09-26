import { z } from "zod";
import { paginationSchema } from "../../lib/validation.js";

export const stockListQuerySchema = paginationSchema.extend({
  productId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  warehouseId: z.uuid().optional(),
  search: z.string().trim().max(150).optional(),
  lowStock: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
});
