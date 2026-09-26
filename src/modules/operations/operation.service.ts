import {
  InventoryDocumentStatus,
  InventoryDocumentType,
  Prisma,
} from "@prisma/client";
import { AppError } from "../../errors/app-error.js";
import { decimalToString, toDecimal } from "../../lib/decimal.js";
import { prisma } from "../../lib/prisma.js";

export interface OperationItemInput {
  productId: string;
  quantity: string;
}

export interface CreateOperationInput {
  clientReference?: string | undefined;
  sourceLocationId?: string | undefined;
  destinationLocationId?: string | undefined;
  reason?: string | undefined;
  items: OperationItemInput[];
}

const operationInclude = {
  sourceLocation: { include: { warehouse: { select: { id: true, name: true } } } },
  destinationLocation: { include: { warehouse: { select: { id: true, name: true } } } },
  createdBy: { select: { id: true, email: true } },
  validatedBy: { select: { id: true, email: true } },
  items: {
    include: { product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } } },
    orderBy: { product: { name: "asc" } },
  },
  movements: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.InventoryDocumentInclude;

type OperationWithRelations = Prisma.InventoryDocumentGetPayload<{ include: typeof operationInclude }>;

export function serializeOperation(operation: OperationWithRelations) {
  return {
    ...operation,
    items: operation.items.map((item) => ({ ...item, quantity: decimalToString(item.quantity) })),
    movements: operation.movements.map((movement) => ({
      ...movement,
      quantity: decimalToString(movement.quantity),
    })),
  };
}

async function validateReferences(input: CreateOperationInput): Promise<void> {
  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    const found = new Set(products.map((product) => product.id));
    throw new AppError(422, "INVALID_PRODUCT", "One or more products are invalid or inactive", {
      productIds: productIds.filter((id) => !found.has(id)),
    });
  }

  const locationIds = [input.sourceLocationId, input.destinationLocationId].filter(
    (id): id is string => Boolean(id),
  );
  const uniqueLocationIds = [...new Set(locationIds)];
  const locations = await prisma.location.findMany({
    where: {
      id: { in: uniqueLocationIds },
      isActive: true,
      warehouse: { isActive: true },
    },
    select: { id: true },
  });
  if (locations.length !== uniqueLocationIds.length) {
    const found = new Set(locations.map((location) => location.id));
    throw new AppError(422, "INVALID_LOCATION", "One or more locations are invalid or inactive", {
      locationIds: uniqueLocationIds.filter((id) => !found.has(id)),
    });
  }
}

export async function createOperation(
  type: InventoryDocumentType,
  createdById: string,
  input: CreateOperationInput,
) {
  await validateReferences(input);

  const operation = await prisma.inventoryDocument.create({
    data: {
      type,
      createdById,
      ...(input.clientReference ? { clientReference: input.clientReference } : {}),
      ...(input.sourceLocationId ? { sourceLocationId: input.sourceLocationId } : {}),
      ...(input.destinationLocationId ? { destinationLocationId: input.destinationLocationId } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          quantity: toDecimal(item.quantity),
        })),
      },
    },
    include: operationInclude,
  });

  return serializeOperation(operation);
}

export async function listOperations(
  type: InventoryDocumentType,
  input: {
    page: number;
    limit: number;
    status?: InventoryDocumentStatus | undefined;
    clientReference?: string | undefined;
  },
) {
  const where: Prisma.InventoryDocumentWhereInput = {
    type,
    ...(input.status ? { status: input.status } : {}),
    ...(input.clientReference
      ? { clientReference: { contains: input.clientReference, mode: "insensitive" } }
      : {}),
  };
  const [operations, total] = await prisma.$transaction([
    prisma.inventoryDocument.findMany({
      where,
      include: operationInclude,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.inventoryDocument.count({ where }),
  ]);
  return {
    operations: operations.map(serializeOperation),
    pagination: { page: input.page, limit: input.limit, total },
  };
}

export async function getOperation(id: string, type: InventoryDocumentType) {
  const operation = await prisma.inventoryDocument.findFirst({
    where: { id, type },
    include: operationInclude,
  });
  if (!operation) {
    throw new AppError(404, "OPERATION_NOT_FOUND", "Inventory operation not found");
  }
  return serializeOperation(operation);
}

export async function cancelOperation(id: string, type: InventoryDocumentType) {
  const result = await prisma.inventoryDocument.updateMany({
    where: { id, type, status: InventoryDocumentStatus.DRAFT },
    data: { status: InventoryDocumentStatus.CANCELED },
  });
  if (result.count === 0) {
    await getOperation(id, type);
    throw new AppError(409, "OPERATION_ALREADY_PROCESSED", "Only draft operations can be canceled");
  }
  return getOperation(id, type);
}

export { operationInclude };
