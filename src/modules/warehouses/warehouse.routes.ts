import { Router } from "express";
import { sendSuccess } from "../../lib/response.js";
import { idParamsSchema } from "../../lib/validation.js";
import {
  createLocationSchema,
  createWarehouseSchema,
  locationListQuerySchema,
  updateLocationSchema,
  updateWarehouseSchema,
} from "./warehouse.schemas.js";
import {
  createLocation,
  createWarehouse,
  getLocation,
  getWarehouse,
  listLocations,
  listWarehouses,
  updateLocation,
  updateWarehouse,
} from "./warehouse.service.js";

export const warehouseRouter = Router();
export const locationRouter = Router();

warehouseRouter.post("/", async (request, response) => {
  const input = createWarehouseSchema.parse(request.body);
  sendSuccess(response, await createWarehouse(input.name), 201);
});

warehouseRouter.get("/", async (_request, response) => {
  sendSuccess(response, await listWarehouses());
});

warehouseRouter.get("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  sendSuccess(response, await getWarehouse(id));
});

warehouseRouter.patch("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  const input = updateWarehouseSchema.parse(request.body);
  sendSuccess(response, await updateWarehouse(id, input));
});

warehouseRouter.post("/:id/locations", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  const input = createLocationSchema.parse(request.body);
  sendSuccess(response, await createLocation(id, input.name), 201);
});

locationRouter.get("/", async (request, response) => {
  const input = locationListQuerySchema.parse(request.query);
  const result = await listLocations(input);
  sendSuccess(response, result.locations, 200, { pagination: result.pagination });
});

locationRouter.get("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  sendSuccess(response, await getLocation(id));
});

locationRouter.patch("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  const input = updateLocationSchema.parse(request.body);
  sendSuccess(response, await updateLocation(id, input));
});
