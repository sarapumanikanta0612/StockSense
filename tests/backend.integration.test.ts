import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

const testDatabaseUrl = process.env["TEST_DATABASE_URL"];

test(
  "complete authenticated inventory workflow",
  { skip: testDatabaseUrl ? false : "TEST_DATABASE_URL is not configured" },
  async (context) => {
    process.env["NODE_ENV"] = "test";
    process.env["DATABASE_URL"] = testDatabaseUrl;
    process.env["JWT_SECRET"] = "integration-test-secret-with-at-least-32-characters";
    process.env["CORS_ORIGIN"] = "http://localhost:5173";

    const { app } = await import("../src/app.js");
    const { prisma } = await import("../src/lib/prisma.js");

    async function resetDatabase(): Promise<void> {
      await prisma.stockMovement.deleteMany();
      await prisma.inventoryDocumentItem.deleteMany();
      await prisma.inventoryDocument.deleteMany();
      await prisma.stockBalance.deleteMany();
      await prisma.product.deleteMany();
      await prisma.productCategory.deleteMany();
      await prisma.location.deleteMany();
      await prisma.warehouse.deleteMany();
      await prisma.user.deleteMany();
    }

    try {
      await resetDatabase();

      let token = "";
      let productId = "";
      let warehouseId = "";
      let sourceLocationId = "";
      let destinationLocationId = "";
      let receiptId = "";

      await context.test("health endpoint confirms the database connection", async () => {
        const response = await request(app).get("/api/v1/health");
        assert.equal(response.status, 200);
        assert.equal(response.body.data.database, "connected");
      });

      await context.test("registration, login, and protected access work", async () => {
        const registration = await request(app).post("/api/v1/auth/register").send({
          email: "manager@example.com",
          password: "correct-horse-battery-staple",
        });
        assert.equal(registration.status, 201);
        assert.equal(registration.body.data.user.role, "WAREHOUSE_STAFF");
        assert.equal(typeof registration.body.data.accessToken, "string");
        assert.equal(registration.body.data.user.passwordHash, undefined);

        const login = await request(app).post("/api/v1/auth/login").send({
          email: "manager@example.com",
          password: "correct-horse-battery-staple",
        });
        assert.equal(login.status, 200);
        token = login.body.data.accessToken;

        const me = await request(app)
          .get("/api/v1/auth/me")
          .set("Authorization", `Bearer ${token}`);
        assert.equal(me.status, 200);
        assert.equal(me.body.data.user.email, "manager@example.com");

        const unauthorized = await request(app).get("/api/v1/products");
        assert.equal(unauthorized.status, 401);
        assert.equal(unauthorized.body.error.code, "AUTHENTICATION_REQUIRED");
      });

      await context.test("product and multi-location setup works", async () => {
        const category = await request(app)
          .post("/api/v1/categories")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Raw Materials" });
        assert.equal(category.status, 201);

        const warehouse = await request(app)
          .post("/api/v1/warehouses")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Main Warehouse" });
        assert.equal(warehouse.status, 201);
        warehouseId = warehouse.body.data.id;

        const source = await request(app)
          .post(`/api/v1/warehouses/${warehouse.body.data.id}/locations`)
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Receiving" });
        const destination = await request(app)
          .post(`/api/v1/warehouses/${warehouse.body.data.id}/locations`)
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Production Rack" });
        assert.equal(source.status, 201);
        assert.equal(destination.status, 201);
        sourceLocationId = source.body.data.id;
        destinationLocationId = destination.body.data.id;

        const product = await request(app)
          .post("/api/v1/products")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "Steel Rod",
            sku: "steel-001",
            categoryId: category.body.data.id,
            unitOfMeasure: "kg",
            reorderLevel: "10",
          });
        assert.equal(product.status, 201);
        assert.equal(product.body.data.sku, "STEEL-001");
        assert.equal(product.body.data.totalStock, "0.000");
        productId = product.body.data.id;

        const detail = await request(app)
          .get(`/api/v1/products/${productId}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(detail.status, 200);
        assert.equal(detail.body.data.name, "Steel Rod");
      });

      await context.test("receipt validation increases stock exactly once", async () => {
        const draft = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            clientReference: "REC-001",
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "100" }],
          });
        assert.equal(draft.status, 201);
        assert.equal(draft.body.data.status, "DRAFT");
        receiptId = draft.body.data.id;

        const completed = await request(app)
          .post(`/api/v1/receipts/${receiptId}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(completed.status, 200);
        assert.equal(completed.body.data.status, "DONE");
        assert.equal(completed.body.data.movements[0].quantity, "100.000");

        const duplicate = await request(app)
          .post(`/api/v1/receipts/${receiptId}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(duplicate.status, 409);
        assert.equal(duplicate.body.error.code, "OPERATION_ALREADY_PROCESSED");
      });

      await context.test("delivery reduces stock and rejects an excessive delivery", async () => {
        const delivery = await request(app)
          .post("/api/v1/deliveries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            items: [{ productId, quantity: "20" }],
          });
        const completed = await request(app)
          .post(`/api/v1/deliveries/${delivery.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(completed.status, 200);
        assert.equal(completed.body.data.movements[0].quantity, "-20.000");

        const excessive = await request(app)
          .post("/api/v1/deliveries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            items: [{ productId, quantity: "1000" }],
          });
        const rejected = await request(app)
          .post(`/api/v1/deliveries/${excessive.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(rejected.status, 409);
        assert.equal(rejected.body.error.code, "INSUFFICIENT_STOCK");
      });

      await context.test("transfer preserves overall stock while changing locations", async () => {
        const transfer = await request(app)
          .post("/api/v1/transfers")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            destinationLocationId,
            items: [{ productId, quantity: "30" }],
          });
        const completed = await request(app)
          .post(`/api/v1/transfers/${transfer.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(completed.status, 200);

        const balances = await prisma.stockBalance.findMany({ where: { productId } });
        assert.equal(
          balances.reduce((total, balance) => total + Number(balance.quantity), 0),
          80,
        );
        assert.equal(
          balances.find((balance) => balance.locationId === sourceLocationId)?.quantity.toFixed(3),
          "50.000",
        );
        assert.equal(
          balances.find((balance) => balance.locationId === destinationLocationId)?.quantity.toFixed(3),
          "30.000",
        );
      });

      await context.test("adjustment changes stock and records its reason", async () => {
        const adjustment = await request(app)
          .post("/api/v1/adjustments")
          .set("Authorization", `Bearer ${token}`)
          .send({
            locationId: destinationLocationId,
            reason: "Damaged material",
            items: [{ productId, quantity: "-5" }],
          });
        const completed = await request(app)
          .post(`/api/v1/adjustments/${adjustment.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(completed.status, 200);
        assert.equal(completed.body.data.reason, "Damaged material");
        assert.equal(completed.body.data.movements[0].quantity, "-5.000");
      });

      await context.test("stock and ledger expose the final consistent state", async () => {
        const stock = await request(app)
          .get(`/api/v1/stock?productId=${productId}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(stock.status, 200);
        assert.equal(stock.body.data.length, 2);
        assert.equal(
          stock.body.data.reduce(
            (total: number, balance: { quantity: string }) => total + Number(balance.quantity),
            0,
          ),
          75,
        );

        const ledger = await request(app)
          .get(`/api/v1/ledger?productId=${productId}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(ledger.status, 200);
        assert.equal(ledger.body.data.length, 4);
        assert.deepEqual(
          new Set(ledger.body.data.map((movement: { type: string }) => movement.type)),
          new Set(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]),
        );
      });

      await context.test("invalid requests, references, constraints, and stock operations are rejected", async () => {
        const invalidId = await request(app)
          .get("/api/v1/products/not-a-uuid")
          .set("Authorization", `Bearer ${token}`);
        assert.equal(invalidId.status, 422);

        const missingFields = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({});
        assert.equal(missingFields.status, 422);

        const invalidQuantity = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "0" }],
          });
        assert.equal(invalidQuantity.status, 422);

        const invalidProduct = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId: "550e8400-e29b-41d4-a716-446655440000", quantity: "1" }],
          });
        assert.equal(invalidProduct.status, 422);
        assert.equal(invalidProduct.body.error.code, "INVALID_PRODUCT");

        const invalidLocation = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: "660e8400-e29b-41d4-a716-446655440000",
            items: [{ productId, quantity: "1" }],
          });
        assert.equal(invalidLocation.status, 422);
        assert.equal(invalidLocation.body.error.code, "INVALID_LOCATION");

        const invalidWarehouse = await request(app)
          .post("/api/v1/warehouses/770e8400-e29b-41d4-a716-446655440000/locations")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Nowhere" });
        assert.equal(invalidWarehouse.status, 404);
        assert.equal(invalidWarehouse.body.error.code, "WAREHOUSE_NOT_FOUND");

        const invalidAdjustment = await request(app)
          .post("/api/v1/adjustments")
          .set("Authorization", `Bearer ${token}`)
          .send({ locationId: sourceLocationId, items: [{ productId, quantity: "0" }] });
        assert.equal(invalidAdjustment.status, 422);

        const duplicateSku = await request(app)
          .post("/api/v1/products")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Duplicate", sku: "STEEL-001", unitOfMeasure: "kg" });
        assert.equal(duplicateSku.status, 409);
        assert.equal(duplicateSku.body.error.code, "CONFLICT");

        const duplicateReference = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            clientReference: "REC-001",
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "1" }],
          });
        assert.equal(duplicateReference.status, 409);

        const excessiveTransfer = await request(app)
          .post("/api/v1/transfers")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            destinationLocationId,
            items: [{ productId, quantity: "999" }],
          });
        const rejectedTransfer = await request(app)
          .post(`/api/v1/transfers/${excessiveTransfer.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(rejectedTransfer.status, 409);
        assert.equal(rejectedTransfer.body.error.code, "INSUFFICIENT_STOCK");
      });

      await context.test("adjustments support positive stock and roll back an excessive reduction", async () => {
        const positiveAdjustment = await request(app)
          .post("/api/v1/adjustments")
          .set("Authorization", `Bearer ${token}`)
          .send({
            locationId: destinationLocationId,
            reason: "Recovered usable material",
            items: [{ productId, quantity: "5" }],
          });
        const positiveResult = await request(app)
          .post(`/api/v1/adjustments/${positiveAdjustment.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(positiveResult.status, 200);
        assert.equal(positiveResult.body.data.movements[0].quantity, "5.000");

        const excessiveAdjustment = await request(app)
          .post("/api/v1/adjustments")
          .set("Authorization", `Bearer ${token}`)
          .send({
            locationId: destinationLocationId,
            reason: "Invalid excessive count correction",
            items: [{ productId, quantity: "-1000" }],
          });
        const rejected = await request(app)
          .post(`/api/v1/adjustments/${excessiveAdjustment.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(rejected.status, 409);
        assert.equal(rejected.body.error.code, "INSUFFICIENT_STOCK");

        const unchangedDraft = await request(app)
          .get(`/api/v1/adjustments/${excessiveAdjustment.body.data.id}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(unchangedDraft.body.data.status, "DRAFT");
        assert.equal(unchangedDraft.body.data.movements.length, 0);

        const balance = await prisma.stockBalance.findUniqueOrThrow({
          where: { productId_locationId: { productId, locationId: destinationLocationId } },
        });
        assert.equal(balance.quantity.toFixed(3), "30.000");
      });

      await context.test("a failed multi-line delivery rolls back every balance and movement", async () => {
        const secondProduct = await request(app)
          .post("/api/v1/products")
          .set("Authorization", `Bearer ${token}`)
          .send({ name: "Copper Wire", sku: "COPPER-001", unitOfMeasure: "kg" });
        assert.equal(secondProduct.status, 201);
        const secondProductId = secondProduct.body.data.id as string;

        const seedReceipt = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId: secondProductId, quantity: "10" }],
          });
        const seeded = await request(app)
          .post(`/api/v1/receipts/${seedReceipt.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(seeded.status, 200);

        const before = await prisma.stockBalance.findMany({
          where: { locationId: sourceLocationId, productId: { in: [productId, secondProductId] } },
          orderBy: { productId: "asc" },
        });

        const delivery = await request(app)
          .post("/api/v1/deliveries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            items: [
              { productId, quantity: "1" },
              { productId: secondProductId, quantity: "999" },
            ],
          });
        const rejected = await request(app)
          .post(`/api/v1/deliveries/${delivery.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(rejected.status, 409);
        assert.equal(rejected.body.error.code, "INSUFFICIENT_STOCK");

        const after = await prisma.stockBalance.findMany({
          where: { locationId: sourceLocationId, productId: { in: [productId, secondProductId] } },
          orderBy: { productId: "asc" },
        });
        assert.deepEqual(
          after.map((balance) => [balance.productId, balance.quantity.toFixed(3)]),
          before.map((balance) => [balance.productId, balance.quantity.toFixed(3)]),
        );

        const unchangedDraft = await request(app)
          .get(`/api/v1/deliveries/${delivery.body.data.id}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(unchangedDraft.body.data.status, "DRAFT");
        assert.equal(unchangedDraft.body.data.movements.length, 0);
      });

      await context.test("posting rechecks active products and locations inside the transaction", async () => {
        const productDraft = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "1" }],
          });

        await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })
          .expect(200);
        const inactiveProductResult = await request(app)
          .post(`/api/v1/receipts/${productDraft.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(inactiveProductResult.status, 422);
        assert.equal(inactiveProductResult.body.error.code, "INVALID_PRODUCT");
        await request(app)
          .patch(`/api/v1/products/${productId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: true })
          .expect(200);

        const locationDraft = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId,
            items: [{ productId, quantity: "1" }],
          });
        await request(app)
          .patch(`/api/v1/locations/${destinationLocationId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })
          .expect(200);
        const inactiveLocationResult = await request(app)
          .post(`/api/v1/receipts/${locationDraft.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(inactiveLocationResult.status, 422);
        assert.equal(inactiveLocationResult.body.error.code, "INVALID_LOCATION");
        await request(app)
          .patch(`/api/v1/locations/${destinationLocationId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: true })
          .expect(200);

        const warehouseDraft = await request(app)
          .post("/api/v1/deliveries")
          .set("Authorization", `Bearer ${token}`)
          .send({
            sourceLocationId,
            items: [{ productId, quantity: "1" }],
          });
        await request(app)
          .patch(`/api/v1/warehouses/${warehouseId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: false })
          .expect(200);
        const inactiveWarehouseResult = await request(app)
          .post(`/api/v1/deliveries/${warehouseDraft.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(inactiveWarehouseResult.status, 422);
        assert.equal(inactiveWarehouseResult.body.error.code, "INVALID_LOCATION");
        await request(app)
          .patch(`/api/v1/warehouses/${warehouseId}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ isActive: true })
          .expect(200);

        for (const draftId of [
          productDraft.body.data.id,
          locationDraft.body.data.id,
          warehouseDraft.body.data.id,
        ]) {
          const draft = await prisma.inventoryDocument.findUniqueOrThrow({
            where: { id: draftId },
            include: { movements: true },
          });
          assert.equal(draft.status, "DRAFT");
          assert.equal(draft.movements.length, 0);
        }
      });

      await context.test("cancellation and concurrent validation never post stock twice", async () => {
        const canceledReceipt = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "1" }],
          });
        const canceled = await request(app)
          .post(`/api/v1/receipts/${canceledReceipt.body.data.id}/cancel`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(canceled.status, 200);
        assert.equal(canceled.body.data.status, "CANCELED");
        const canceledValidation = await request(app)
          .post(`/api/v1/receipts/${canceledReceipt.body.data.id}/validate`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(canceledValidation.status, 409);

        const concurrentReceipt = await request(app)
          .post("/api/v1/receipts")
          .set("Authorization", `Bearer ${token}`)
          .send({
            destinationLocationId: sourceLocationId,
            items: [{ productId, quantity: "1" }],
          });
        const results = await Promise.all([
          request(app)
            .post(`/api/v1/receipts/${concurrentReceipt.body.data.id}/validate`)
            .set("Authorization", `Bearer ${token}`),
          request(app)
            .post(`/api/v1/receipts/${concurrentReceipt.body.data.id}/validate`)
            .set("Authorization", `Bearer ${token}`),
        ]);
        assert.deepEqual(
          results.map((result) => result.status).sort(),
          [200, 409],
        );

        const completed = await request(app)
          .get(`/api/v1/receipts/${concurrentReceipt.body.data.id}`)
          .set("Authorization", `Bearer ${token}`);
        assert.equal(completed.body.data.status, "DONE");
        assert.equal(completed.body.data.movements.length, 1);
        assert.equal(completed.body.data.movements[0].quantity, "1.000");
      });
    } finally {
      await resetDatabase();
      await prisma.$disconnect();
    }
  },
);
