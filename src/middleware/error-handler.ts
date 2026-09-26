import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErrors: Record<string, { status: number; code: string; message: string }> = {
      P2002: { status: 409, code: "CONFLICT", message: "A record with this value already exists" },
      P2003: { status: 422, code: "INVALID_REFERENCE", message: "A referenced record does not exist" },
      P2025: { status: 404, code: "NOT_FOUND", message: "The requested record was not found" },
    };
    const mapped = prismaErrors[error.code];
    if (mapped) {
      response.status(mapped.status).json({
        success: false,
        error: { code: mapped.code, message: mapped.message },
      });
      return;
    }
  }

  if (env.NODE_ENV !== "test") {
    console.error(error);
  }

  response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
