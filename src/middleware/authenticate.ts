import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../modules/auth/token.js";

export const authenticate: RequestHandler = async (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "A Bearer access token is required");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "A Bearer access token is required");
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findFirst({
    where: { id: payload.userId, isActive: true },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw new AppError(401, "INVALID_TOKEN", "The token user is unavailable");
  }

  request.user = user;
  next();
};
