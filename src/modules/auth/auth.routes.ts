import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { sendSuccess } from "../../lib/response.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { login, register } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const input = registerSchema.parse(request.body);
  const result = await register(input.email, input.password);
  sendSuccess(response, result, 201);
});

authRouter.post("/login", async (request, response) => {
  const input = loginSchema.parse(request.body);
  const result = await login(input.email, input.password);
  sendSuccess(response, result);
});

authRouter.get("/me", authenticate, (request, response) => {
  sendSuccess(response, { user: request.user });
});
