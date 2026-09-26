import { Router } from "express";
import { sendSuccess } from "../../lib/response.js";
import { ledgerListQuerySchema } from "./ledger.schemas.js";
import { listLedger } from "./ledger.service.js";

export const ledgerRouter = Router();

ledgerRouter.get("/", async (request, response) => {
  const input = ledgerListQuerySchema.parse(request.query);
  const result = await listLedger(input);
  sendSuccess(response, result.movements, 200, { pagination: result.pagination });
});
