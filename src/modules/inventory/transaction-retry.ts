import { Prisma } from "@prisma/client";

export const SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

export function isSerializableTransactionConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function retrySerializableTransaction<T>(
  operation: () => Promise<T>,
  maxAttempts = SERIALIZABLE_TRANSACTION_ATTEMPTS,
): Promise<T> {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSerializableTransactionConflict(error) || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("Serializable transaction retry loop exhausted unexpectedly");
}
