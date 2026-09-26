import { InventoryDocumentType } from "@prisma/client";
import { Router, type RequestHandler } from "express";
import { AppError } from "../../errors/app-error.js";
import { sendSuccess } from "../../lib/response.js";
import { idParamsSchema } from "../../lib/validation.js";
import { validateOperation } from "../inventory/inventory.service.js";
import {
  adjustmentSchema,
  deliverySchema,
  operationListQuerySchema,
  receiptSchema,
  transferSchema,
} from "./operation.schemas.js";
import {
  cancelOperation,
  createOperation,
  getOperation,
  listOperations,
  type CreateOperationInput,
} from "./operation.service.js";

type BodyParser = { parse: (value: unknown) => Record<string, unknown> };

function userId(request: Parameters<RequestHandler>[0]): string {
  if (!request.user) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required");
  }
  return request.user.id;
}

export function createOperationRouter(type: InventoryDocumentType, schema: BodyParser): Router {
  const router = Router();

  router.post("/", async (request, response) => {
    const parsed = schema.parse(request.body);
    const input: CreateOperationInput = {
      ...(typeof parsed["clientReference"] === "string"
        ? { clientReference: parsed["clientReference"] }
        : {}),
      ...(typeof parsed["sourceLocationId"] === "string"
        ? { sourceLocationId: parsed["sourceLocationId"] }
        : {}),
      ...(typeof parsed["destinationLocationId"] === "string"
        ? { destinationLocationId: parsed["destinationLocationId"] }
        : {}),
      ...(typeof parsed["locationId"] === "string" ? { sourceLocationId: parsed["locationId"] } : {}),
      ...(typeof parsed["reason"] === "string" ? { reason: parsed["reason"] } : {}),
      items: parsed["items"] as CreateOperationInput["items"],
    };
    sendSuccess(response, await createOperation(type, userId(request), input), 201);
  });

  router.get("/", async (request, response) => {
    const input = operationListQuerySchema.parse(request.query);
    const result = await listOperations(type, input);
    sendSuccess(response, result.operations, 200, { pagination: result.pagination });
  });

  router.get("/:id", async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    sendSuccess(response, await getOperation(id, type));
  });

  router.post("/:id/validate", async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    sendSuccess(response, await validateOperation(id, type, userId(request)));
  });

  router.post("/:id/cancel", async (request, response) => {
    const { id } = idParamsSchema.parse(request.params);
    sendSuccess(response, await cancelOperation(id, type));
  });

  return router;
}

export const receiptRouter = createOperationRouter(InventoryDocumentType.RECEIPT, receiptSchema);
export const deliveryRouter = createOperationRouter(InventoryDocumentType.DELIVERY, deliverySchema);
export const transferRouter = createOperationRouter(InventoryDocumentType.TRANSFER, transferSchema);
export const adjustmentRouter = createOperationRouter(InventoryDocumentType.ADJUSTMENT, adjustmentSchema);
