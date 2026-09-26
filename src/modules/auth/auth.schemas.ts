import { z } from "zod";

const email = z
  .email()
  .max(320)
  .transform((value) => value.trim().toLowerCase());

const password = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must not exceed 72 UTF-8 bytes",
  });

export const registerSchema = z.object({
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
