import { z } from "zod";
import { paginationSchema } from "../../lib/validation.js";

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateWarehouseSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateLocationSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });

export const locationListQuerySchema = paginationSchema.extend({
  warehouseId: z.uuid().optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").default(true),
});
