import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  Prisma,
  StockMovementType,
} from "@prisma/client";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { operationInclude, serializeOperation } from "../operations/operation.service.js";
import {
  isSerializableTransactionConflict,
  retrySerializableTransaction,
} from "./transaction-retry.js";

type TransactionClient = Prisma.TransactionClient;

async function increaseBalance(
  transaction: TransactionClient,
  productId: string,
  locationId: string,
  quantity: Prisma.Decimal,
): Promise<void> {
  await transaction.stockBalance.upsert({
    where: { productId_locationId: { productId, locationId } },
    create: { productId, locationId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

async function decreaseBalance(
  transaction: TransactionClient,
  productId: string,
  locationId: string,
  quantity: Prisma.Decimal,
): Promise<void> {
  const updated = await transaction.stockBalance.updateMany({
    where: { productId, locationId, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } },
  });

  if (updated.count === 0) {
    throw new AppError(409, "INSUFFICIENT_STOCK", "Insufficient stock at the source location", {
      productId,
      locationId,
      requestedQuantity: quantity.toFixed(3),
    });
  }
}

type OperationForPosting = Prisma.InventoryDocumentGetPayload<{ include: { items: true } }>;

async function validateActiveReferences(
  transaction: TransactionClient,
  operation: OperationForPosting,
): Promise<void> {
  const productIds = operation.items.map((item) => item.productId);
  const activeProducts = await transaction.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  });

  if (activeProducts.length !== productIds.length) {
    const activeProductIds = new Set(activeProducts.map((product) => product.id));
    throw new AppError(422, "INVALID_PRODUCT", "One or more products are invalid or inactive", {
      productIds: productIds.filter((productId) => !activeProductIds.has(productId)),
    });
  }

  const locationIds = [operation.sourceLocationId, operation.destinationLocationId].filter(
    (locationId): locationId is string => locationId !== null,
  );
  const uniqueLocationIds = [...new Set(locationIds)];
  const activeLocations = await transaction.location.findMany({
    where: {
      id: { in: uniqueLocationIds },
      isActive: true,
      warehouse: { isActive: true },
    },
    select: { id: true },
  });

  if (activeLocations.length !== uniqueLocationIds.length) {
    const activeLocationIds = new Set(activeLocations.map((location) => location.id));
    throw new AppError(422, "INVALID_LOCATION", "One or more locations are invalid or inactive", {
      locationIds: uniqueLocationIds.filter((locationId) => !activeLocationIds.has(locationId)),
    });
  }
}

async function runValidationTransaction(
  id: string,
  type: InventoryDocumentType,
  performedById: string,
) {
  return prisma.$transaction(
    async (transaction) => {
      const claimed = await transaction.inventoryDocument.updateMany({
        where: { id, type, status: InventoryDocumentStatus.DRAFT },
        data: {
          status: InventoryDocumentStatus.DONE,
          validatedById: performedById,
          validatedAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        const existing = await transaction.inventoryDocument.findFirst({ where: { id, type } });
        if (!existing) {
          throw new AppError(404, "OPERATION_NOT_FOUND", "Inventory operation not found");
        }
        throw new AppError(409, "OPERATION_ALREADY_PROCESSED", "The operation is not in draft status");
      }

      const operation = await transaction.inventoryDocument.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
      await validateActiveReferences(transaction, operation);

      for (const item of operation.items) {
        let movementQuantity = item.quantity;
        let movementSourceId: string | null = operation.sourceLocationId;
        let movementDestinationId: string | null = operation.destinationLocationId;

        switch (type) {
          case InventoryDocumentType.RECEIPT: {
            if (!operation.destinationLocationId || !item.quantity.isPositive()) {
              throw new AppError(422, "INVALID_OPERATION", "Receipt data is invalid");
            }
            await increaseBalance(
              transaction,
              item.productId,
              operation.destinationLocationId,
              item.quantity,
            );
            break;
          }
          case InventoryDocumentType.DELIVERY: {
            if (!operation.sourceLocationId || !item.quantity.isPositive()) {
              throw new AppError(422, "INVALID_OPERATION", "Delivery data is invalid");
            }
            await decreaseBalance(transaction, item.productId, operation.sourceLocationId, item.quantity);
            movementQuantity = item.quantity.negated();
            break;
          }
          case InventoryDocumentType.TRANSFER: {
            if (
              !operation.sourceLocationId ||
              !operation.destinationLocationId ||
              operation.sourceLocationId === operation.destinationLocationId ||
              !item.quantity.isPositive()
            ) {
              throw new AppError(422, "INVALID_OPERATION", "Transfer data is invalid");
            }
            await decreaseBalance(transaction, item.productId, operation.sourceLocationId, item.quantity);
            await increaseBalance(
              transaction,
              item.productId,
              operation.destinationLocationId,
              item.quantity,
            );
            break;
          }
          case InventoryDocumentType.ADJUSTMENT: {
            if (!operation.sourceLocationId || item.quantity.isZero() || !operation.reason) {
              throw new AppError(422, "INVALID_OPERATION", "Adjustment data is invalid");
            }
            if (item.quantity.isPositive()) {
              await increaseBalance(transaction, item.productId, operation.sourceLocationId, item.quantity);
              movementSourceId = null;
              movementDestinationId = operation.sourceLocationId;
            } else {
              await decreaseBalance(
                transaction,
                item.productId,
                operation.sourceLocationId,
                item.quantity.abs(),
              );
              movementSourceId = operation.sourceLocationId;
              movementDestinationId = null;
            }
            break;
          }
        }

        await transaction.stockMovement.create({
          data: {
            type: type as StockMovementType,
            productId: item.productId,
            quantity: movementQuantity,
            sourceLocationId: movementSourceId,
            destinationLocationId: movementDestinationId,
            documentId: operation.id,
            documentItemId: item.id,
            performedById,
          },
        });
      }

      const completed = await transaction.inventoryDocument.findUniqueOrThrow({
        where: { id },
        include: operationInclude,
      });
      return serializeOperation(completed);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function validateOperation(
  id: string,
  type: InventoryDocumentType,
  performedById: string,
) {
  try {
    return await retrySerializableTransaction(() =>
      runValidationTransaction(id, type, performedById),
    );
  } catch (error) {
    if (!isSerializableTransactionConflict(error)) {
      throw error;
    }
    throw new AppError(
      409,
      "INVENTORY_CONFLICT",
      "Inventory changed concurrently; retry the operation",
      { retryable: true },
    );
  }
}
