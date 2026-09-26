import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import {
  retrySerializableTransaction,
  SERIALIZABLE_TRANSACTION_ATTEMPTS,
} from "../src/modules/inventory/transaction-retry.js";

function serializableConflict(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Transaction write conflict", {
    code: "P2034",
    clientVersion: "6.12.0",
  });
}

test("serializable transactions retry P2034 conflicts and return the successful result", async () => {
  let attempts = 0;

  const result = await retrySerializableTransaction(async () => {
    attempts += 1;
    if (attempts < SERIALIZABLE_TRANSACTION_ATTEMPTS) {
      throw serializableConflict();
    }
    return { status: "DONE" };
  });

  assert.equal(attempts, SERIALIZABLE_TRANSACTION_ATTEMPTS);
  assert.deepEqual(result, { status: "DONE" });
});

test("serializable transactions stop after three P2034 failures", async () => {
  let attempts = 0;

  await assert.rejects(
    retrySerializableTransaction(async () => {
      attempts += 1;
      throw serializableConflict();
    }),
    (error: unknown) =>
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034",
  );
  assert.equal(attempts, SERIALIZABLE_TRANSACTION_ATTEMPTS);
});

test("serializable transactions do not retry unrelated failures", async () => {
  let attempts = 0;
  const expected = new Error("Insufficient stock");

  await assert.rejects(
    retrySerializableTransaction(async () => {
      attempts += 1;
      throw expected;
    }),
    (error: unknown) => error === expected,
  );
  assert.equal(attempts, 1);
});

test("serializable transaction retry count must be positive", async () => {
  await assert.rejects(
    retrySerializableTransaction(async () => "unused", 0),
    /maxAttempts must be a positive integer/,
  );
});
