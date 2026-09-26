import { Router } from "express";
import { sendSuccess } from "../../lib/response.js";
import { stockListQuerySchema } from "./stock.schemas.js";
import { listStock } from "./stock.service.js";

export const stockRouter = Router();

stockRouter.get("/", async (request, response) => {
  const input = stockListQuerySchema.parse(request.query);
  const result = await listStock(input);
  sendSuccess(response, result.balances, 200, { pagination: result.pagination });
});
