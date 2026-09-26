import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { sendSuccess } from "../../lib/response.js";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  sendSuccess(response, {
    status: "ok",
    database: "connected",
  });
});
