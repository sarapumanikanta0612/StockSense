import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  // Optional AI insight provider (OpenAI-compatible chat completions API).
  // When AI_API_KEY is unset, the smart-features layer uses a deterministic
  // rule-based narrative instead, so the app runs fully without any AI setup.
  AI_API_KEY: z.string().min(1).optional(),
  AI_BASE_URL: z.string().min(1).default("https://api.openai.com/v1"),
  AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const message = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = result.data;
