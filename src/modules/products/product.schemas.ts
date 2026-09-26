import { z } from "zod";
import { decimalInput, paginationSchema } from "../../lib/validation.js";

const productFields = {
  name: z.string().trim().min(1).max(150),
  sku: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase()),
  categoryId: z.uuid().nullable().optional(),
  unitOfMeasure: z.string().trim().min(1).max(32),
  reorderLevel: decimalInput({ nonnegative: true }).default("0"),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z
  .object({
    ...productFields,
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const productListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(150).optional(),
  categoryId: z.uuid().optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").default(true),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
