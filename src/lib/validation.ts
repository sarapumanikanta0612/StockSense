import { z } from "zod";

export const idParamsSchema = z.object({ id: z.uuid() });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export function decimalInput(options: { positive?: boolean; nonnegative?: boolean; nonzero?: boolean } = {}) {
  return z
    .union([z.string(), z.number().finite()])
    .transform((value) => String(value).trim())
    .refine((value) => /^-?\d{1,15}(?:\.\d{1,3})?$/.test(value), {
      message: "Quantity must be a decimal with at most 3 fractional digits",
    })
    .refine((value) => !options.positive || Number(value) > 0, {
      message: "Quantity must be greater than zero",
    })
    .refine((value) => !options.nonnegative || Number(value) >= 0, {
      message: "Quantity must not be negative",
    })
    .refine((value) => !options.nonzero || Number(value) !== 0, {
      message: "Quantity must not be zero",
    });
}
