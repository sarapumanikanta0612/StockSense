import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { stockRouter } from "./modules/inventory/stock.routes.js";
import {
  adjustmentRouter,
  deliveryRouter,
  receiptRouter,
  transferRouter,
} from "./modules/operations/operation.routes.js";
import { categoryRouter, productRouter } from "./modules/products/product.routes.js";
import { locationRouter, warehouseRouter } from "./modules/warehouses/warehouse.routes.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", authenticate, productRouter);
app.use("/api/v1/categories", authenticate, categoryRouter);
app.use("/api/v1/warehouses", authenticate, warehouseRouter);
app.use("/api/v1/locations", authenticate, locationRouter);
app.use("/api/v1/stock", authenticate, stockRouter);
app.use("/api/v1/receipts", authenticate, receiptRouter);
app.use("/api/v1/deliveries", authenticate, deliveryRouter);
app.use("/api/v1/transfers", authenticate, transferRouter);
app.use("/api/v1/adjustments", authenticate, adjustmentRouter);

app.use(notFound);
app.use(errorHandler);
