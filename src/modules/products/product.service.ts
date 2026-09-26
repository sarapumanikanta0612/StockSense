import { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error.js";
import { decimalToString, toDecimal } from "../../lib/decimal.js";
import { prisma } from "../../lib/prisma.js";

const productInclude = {
  category: { select: { id: true, name: true } },
  balances: {
    include: {
      location: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
    orderBy: { location: { name: "asc" } },
  },
} satisfies Prisma.ProductInclude;

type ProductWithStock = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function serializeProduct(product: ProductWithStock) {
  const totalStock = product.balances.reduce(
    (total, balance) => total.plus(balance.quantity),
    new Prisma.Decimal(0),
  );

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    unitOfMeasure: product.unitOfMeasure,
    reorderLevel: decimalToString(product.reorderLevel),
    isActive: product.isActive,
    category: product.category,
    totalStock: decimalToString(totalStock),
    stockByLocation: product.balances.map((balance) => ({
      quantity: decimalToString(balance.quantity),
      location: {
        id: balance.location.id,
        name: balance.location.name,
        warehouse: balance.location.warehouse,
      },
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function createProduct(input: {
  name: string;
  sku: string;
  categoryId?: string | null | undefined;
  unitOfMeasure: string;
  reorderLevel: string;
}) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      sku: input.sku,
      unitOfMeasure: input.unitOfMeasure,
      reorderLevel: toDecimal(input.reorderLevel),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
    include: productInclude,
  });
  return serializeProduct(product);
}

export async function listProducts(input: {
  page: number;
  limit: number;
  search?: string | undefined;
  categoryId?: string | undefined;
  isActive: boolean;
}) {
  const where: Prisma.ProductWhereInput = {
    isActive: input.isActive,
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { sku: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: "asc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(serializeProduct),
    pagination: { page: input.page, limit: input.limit, total },
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  return serializeProduct(product);
}

export async function updateProduct(
  id: string,
  input: {
    name?: string | undefined;
    sku?: string | undefined;
    categoryId?: string | null | undefined;
    unitOfMeasure?: string | undefined;
    reorderLevel?: string | undefined;
    isActive?: boolean | undefined;
  },
) {
  await getProduct(id);
  const data: Prisma.ProductUncheckedUpdateInput = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.sku !== undefined ? { sku: input.sku } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
    ...(input.reorderLevel !== undefined ? { reorderLevel: toDecimal(input.reorderLevel) } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
  const product = await prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });
  return serializeProduct(product);
}

export async function deactivateProduct(id: string) {
  await getProduct(id);
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: productInclude,
  });
  return serializeProduct(product);
}

export async function createCategory(name: string) {
  return prisma.productCategory.create({ data: { name } });
}

export async function listCategories() {
  return prisma.productCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}
