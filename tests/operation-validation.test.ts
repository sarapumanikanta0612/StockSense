import assert from "node:assert/strict";
import test from "node:test";
import {
  adjustmentSchema,
  deliverySchema,
  transferSchema,
} from "../src/modules/operations/operation.schemas.js";

const productId = "123e4567-e89b-12d3-a456-426614174000";
const sourceLocationId = "223e4567-e89b-12d3-a456-426614174000";
const destinationLocationId = "323e4567-e89b-12d3-a456-426614174000";

test("delivery rejects zero and negative quantities", () => {
  for (const quantity of ["0", "-1"]) {
    assert.equal(
      deliverySchema.safeParse({ sourceLocationId, items: [{ productId, quantity }] }).success,
      false,
    );
  }
});

test("transfer rejects identical source and destination", () => {
  assert.equal(
    transferSchema.safeParse({
      sourceLocationId,
      destinationLocationId: sourceLocationId,
      items: [{ productId, quantity: "1" }],
    }).success,
    false,
  );
});

test("adjustment requires a nonzero quantity and reason", () => {
  assert.equal(
    adjustmentSchema.safeParse({
      locationId: destinationLocationId,
      reason: "",
      items: [{ productId, quantity: "0" }],
    }).success,
    false,
  );
});

test("quantity precision is limited to three fractional digits", () => {
  assert.equal(
    deliverySchema.safeParse({
      sourceLocationId,
      items: [{ productId, quantity: "1.0001" }],
    }).success,
    false,
  );
});
