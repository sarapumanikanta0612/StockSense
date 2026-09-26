import assert from "node:assert/strict";
import test from "node:test";

process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/stocksense_test";
process.env["JWT_SECRET"] = "test-only-secret-with-at-least-32-characters";

const { hashPassword, verifyPassword } = await import("../src/modules/auth/password.js");
const { createAccessToken, verifyAccessToken } = await import("../src/modules/auth/token.js");

test("password hashing does not store plaintext and verifies correctly", async () => {
  const hash = await hashPassword("correct-horse-battery-staple");

  assert.notEqual(hash, "correct-horse-battery-staple");
  assert.equal(await verifyPassword("correct-horse-battery-staple", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("access tokens preserve the authenticated user identity", () => {
  const token = createAccessToken({
    userId: "123e4567-e89b-12d3-a456-426614174000",
    role: "WAREHOUSE_STAFF",
  });

  assert.deepEqual(verifyAccessToken(token), {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    role: "WAREHOUSE_STAFF",
  });
});
