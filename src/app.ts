import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);

app.use(notFound);
app.use(errorHandler);
