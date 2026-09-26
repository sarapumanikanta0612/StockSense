-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INVENTORY_MANAGER', 'WAREHOUSE_STAFF');
CREATE TYPE "InventoryDocumentType" AS ENUM ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT');
CREATE TYPE "InventoryDocumentStatus" AS ENUM ('DRAFT', 'DONE', 'CANCELED');
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WAREHOUSE_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "categoryId" UUID,
    "unitOfMeasure" VARCHAR(32) NOT NULL,
    "reorderLevel" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_reorderLevel_nonnegative" CHECK ("reorderLevel" >= 0)
);

CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockBalance" (
    "productId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockBalance_pkey" PRIMARY KEY ("productId", "locationId"),
    CONSTRAINT "StockBalance_quantity_nonnegative" CHECK ("quantity" >= 0)
);

CREATE TABLE "InventoryDocument" (
    "id" UUID NOT NULL,
    "type" "InventoryDocumentType" NOT NULL,
    "status" "InventoryDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "clientReference" VARCHAR(120),
    "sourceLocationId" UUID,
    "destinationLocationId" UUID,
    "reason" VARCHAR(500),
    "createdById" UUID NOT NULL,
    "validatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    CONSTRAINT "InventoryDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InventoryDocument_location_shape" CHECK (
      ("type" = 'RECEIPT' AND "sourceLocationId" IS NULL AND "destinationLocationId" IS NOT NULL)
      OR ("type" = 'DELIVERY' AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NULL)
      OR ("type" = 'TRANSFER' AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NOT NULL AND "sourceLocationId" <> "destinationLocationId")
      OR ("type" = 'ADJUSTMENT' AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NULL AND "reason" IS NOT NULL)
    )
);

CREATE TABLE "InventoryDocumentItem" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    CONSTRAINT "InventoryDocumentItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InventoryDocumentItem_quantity_nonzero" CHECK ("quantity" <> 0)
);

CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "sourceLocationId" UUID,
    "destinationLocationId" UUID,
    "documentId" UUID NOT NULL,
    "documentItemId" UUID NOT NULL,
    "performedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockMovement_shape" CHECK (
      ("type" = 'RECEIPT' AND "quantity" > 0 AND "sourceLocationId" IS NULL AND "destinationLocationId" IS NOT NULL)
      OR ("type" = 'DELIVERY' AND "quantity" < 0 AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NULL)
      OR ("type" = 'TRANSFER' AND "quantity" > 0 AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NOT NULL AND "sourceLocationId" <> "destinationLocationId")
      OR ("type" = 'ADJUSTMENT' AND (("quantity" > 0 AND "sourceLocationId" IS NULL AND "destinationLocationId" IS NOT NULL) OR ("quantity" < 0 AND "sourceLocationId" IS NOT NULL AND "destinationLocationId" IS NULL)))
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");
CREATE INDEX "Location_warehouseId_idx" ON "Location"("warehouseId");
CREATE UNIQUE INDEX "Location_warehouseId_name_key" ON "Location"("warehouseId", "name");
CREATE INDEX "StockBalance_locationId_idx" ON "StockBalance"("locationId");
CREATE INDEX "InventoryDocument_type_status_idx" ON "InventoryDocument"("type", "status");
CREATE INDEX "InventoryDocument_sourceLocationId_idx" ON "InventoryDocument"("sourceLocationId");
CREATE INDEX "InventoryDocument_destinationLocationId_idx" ON "InventoryDocument"("destinationLocationId");
CREATE INDEX "InventoryDocument_createdAt_idx" ON "InventoryDocument"("createdAt");
CREATE UNIQUE INDEX "InventoryDocument_type_clientReference_key" ON "InventoryDocument"("type", "clientReference");
CREATE INDEX "InventoryDocumentItem_productId_idx" ON "InventoryDocumentItem"("productId");
CREATE UNIQUE INDEX "InventoryDocumentItem_documentId_productId_key" ON "InventoryDocumentItem"("documentId", "productId");
CREATE UNIQUE INDEX "StockMovement_documentItemId_key" ON "StockMovement"("documentItemId");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_sourceLocationId_idx" ON "StockMovement"("sourceLocationId");
CREATE INDEX "StockMovement_destinationLocationId_idx" ON "StockMovement"("destinationLocationId");
CREATE INDEX "StockMovement_documentId_idx" ON "StockMovement"("documentId");
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryDocumentItem" ADD CONSTRAINT "InventoryDocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "InventoryDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryDocumentItem" ADD CONSTRAINT "InventoryDocumentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "InventoryDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_documentItemId_fkey" FOREIGN KEY ("documentItemId") REFERENCES "InventoryDocumentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
