import { Prisma, type StockMovementType } from "@prisma/client";
import { decimalToString } from "../../lib/decimal.js";
import { prisma } from "../../lib/prisma.js";

export async function listLedger(input: {
  page: number;
  limit: number;
  type?: StockMovementType | undefined;
  productId?: string | undefined;
  locationId?: string | undefined;
  warehouseId?: string | undefined;
  documentId?: string | undefined;
  performedById?: string | undefined;
  search?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}) {
  const and: Prisma.StockMovementWhereInput[] = [];
  if (input.locationId) {
    and.push({
      OR: [{ sourceLocationId: input.locationId }, { destinationLocationId: input.locationId }],
    });
  } else if (input.warehouseId) {
    and.push({
      OR: [
        { sourceLocation: { warehouseId: input.warehouseId } },
        { destinationLocation: { warehouseId: input.warehouseId } },
      ],
    });
  }
  if (input.search) {
    and.push({
      OR: [
        { product: { name: { contains: input.search, mode: "insensitive" } } },
        { product: { sku: { contains: input.search, mode: "insensitive" } } },
        { document: { clientReference: { contains: input.search, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.StockMovementWhereInput = {
    ...(input.type ? { type: input.type } : {}),
    ...(input.productId ? { productId: input.productId } : {}),
    ...(input.documentId ? { documentId: input.documentId } : {}),
    ...(input.performedById ? { performedById: input.performedById } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        }
      : {}),
    ...(and.length > 0 ? { AND: and } : {}),
  };

  const include = {
    product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
    sourceLocation: { include: { warehouse: { select: { id: true, name: true } } } },
    destinationLocation: { include: { warehouse: { select: { id: true, name: true } } } },
    document: { select: { id: true, type: true, clientReference: true } },
    performedBy: { select: { id: true, email: true } },
  } satisfies Prisma.StockMovementInclude;

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements: movements.map((movement) => ({
      ...movement,
      quantity: decimalToString(movement.quantity),
    })),
    pagination: { page: input.page, limit: input.limit, total },
  };
}
