import { Router } from "express";
import { sendSuccess } from "../../lib/response.js";
import { idParamsSchema } from "../../lib/validation.js";
import {
  createCategorySchema,
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from "./product.schemas.js";
import {
  createCategory,
  createProduct,
  deactivateProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "./product.service.js";

export const productRouter = Router();
export const categoryRouter = Router();

productRouter.post("/", async (request, response) => {
  const input = createProductSchema.parse(request.body);
  sendSuccess(response, await createProduct(input), 201);
});

productRouter.get("/", async (request, response) => {
  const input = productListQuerySchema.parse(request.query);
  const result = await listProducts(input);
  sendSuccess(response, result.products, 200, { pagination: result.pagination });
});

productRouter.get("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  sendSuccess(response, await getProduct(id));
});

productRouter.patch("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  const input = updateProductSchema.parse(request.body);
  sendSuccess(response, await updateProduct(id, input));
});

productRouter.delete("/:id", async (request, response) => {
  const { id } = idParamsSchema.parse(request.params);
  sendSuccess(response, await deactivateProduct(id));
});

categoryRouter.post("/", async (request, response) => {
  const input = createCategorySchema.parse(request.body);
  sendSuccess(response, await createCategory(input.name), 201);
});

categoryRouter.get("/", async (_request, response) => {
  sendSuccess(response, await listCategories());
});
