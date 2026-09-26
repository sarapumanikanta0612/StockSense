import { Prisma } from "@prisma/client";

export function toDecimal(value: string): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(3);
}
