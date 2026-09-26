import { Prisma } from "@prisma/client";
import { decimalToString } from "../../lib/decimal.js";
import { prisma } from "../../lib/prisma.js";

export async function listStock(input: {
  page: number;
  limit: number;
  productId?: string | undefined;
  locationId?: string | undefined;
  warehouseId?: string | undefined;
  search?: string | undefined;
  lowStock: boolean;
}) {
  const where: Prisma.StockBalanceWhereInput = {
    ...(input.productId ? { productId: input.productId } : {}),
    ...(input.locationId ? { locationId: input.locationId } : {}),
    ...(input.warehouseId ? { location: { warehouseId: input.warehouseId } } : {}),
    ...(input.search
      ? {
          product: {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { sku: { contains: input.search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const balances = await prisma.stockBalance.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true, unitOfMeasure: true, reorderLevel: true } },
      location: { include: { warehouse: { select: { id: true, name: true } } } },
    },
    orderBy: [{ product: { name: "asc" } }, { location: { name: "asc" } }],
  });

  const filtered = input.lowStock
    ? balances.filter((balance) => balance.quantity.lessThanOrEqualTo(balance.product.reorderLevel))
    : balances;
  const start = (input.page - 1) * input.limit;
  const page = filtered.slice(start, start + input.limit);

  return {
    balances: page.map((balance) => ({
      product: {
        ...balance.product,
        reorderLevel: decimalToString(balance.product.reorderLevel),
      },
      location: balance.location,
      quantity: decimalToString(balance.quantity),
      isLowStock: balance.quantity.lessThanOrEqualTo(balance.product.reorderLevel),
      updatedAt: balance.updatedAt,
    })),
    pagination: { page: input.page, limit: input.limit, total: filtered.length },
  };
}
