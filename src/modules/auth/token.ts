import type { UserRole } from "@prisma/client";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export function createAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    subject: payload.userId,
    expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
    algorithm: "HS256",
  };

  return jwt.sign({ role: payload.role }, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (!decoded.sub || typeof decoded.role !== "string") {
      throw new Error("Token payload is incomplete");
    }

    return {
      userId: decoded.sub,
      role: decoded.role as UserRole,
    };
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "The access token is invalid or expired");
  }
}
