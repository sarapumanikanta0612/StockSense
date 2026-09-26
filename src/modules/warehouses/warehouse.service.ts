import { Prisma } from "@prisma/client";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

export async function createWarehouse(name: string) {
  return prisma.warehouse.create({ data: { name }, include: { locations: true } });
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    include: { locations: { where: { isActive: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: { locations: { orderBy: { name: "asc" } } },
  });
  if (!warehouse) {
    throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Warehouse not found");
  }
  return warehouse;
}

export async function updateWarehouse(id: string, data: { name?: string | undefined; isActive?: boolean | undefined }) {
  await getWarehouse(id);
  const update: Prisma.WarehouseUpdateInput = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  };
  return prisma.warehouse.update({ where: { id }, data: update, include: { locations: true } });
}

export async function createLocation(warehouseId: string, name: string) {
  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, isActive: true } });
  if (!warehouse) {
    throw new AppError(404, "WAREHOUSE_NOT_FOUND", "Active warehouse not found");
  }
  return prisma.location.create({
    data: { warehouseId, name },
    include: { warehouse: { select: { id: true, name: true } } },
  });
}

export async function listLocations(input: {
  page: number;
  limit: number;
  warehouseId?: string | undefined;
  isActive: boolean;
}) {
  const where: Prisma.LocationWhereInput = {
    isActive: input.isActive,
    ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
  };
  const [locations, total] = await prisma.$transaction([
    prisma.location.findMany({
      where,
      include: { warehouse: { select: { id: true, name: true, isActive: true } } },
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.location.count({ where }),
  ]);
  return { locations, pagination: { page: input.page, limit: input.limit, total } };
}

export async function getLocation(id: string) {
  const location = await prisma.location.findUnique({
    where: { id },
    include: { warehouse: { select: { id: true, name: true, isActive: true } } },
  });
  if (!location) {
    throw new AppError(404, "LOCATION_NOT_FOUND", "Location not found");
  }
  return location;
}

export async function updateLocation(id: string, data: { name?: string | undefined; isActive?: boolean | undefined }) {
  await getLocation(id);
  const update: Prisma.LocationUpdateInput = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  };
  return prisma.location.update({
    where: { id },
    data: update,
    include: { warehouse: { select: { id: true, name: true, isActive: true } } },
  });
}
