import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyAgainstDummyHash, verifyPassword } from "./password.js";
import { createAccessToken } from "./token.js";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function register(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: publicUserSelect,
  });

  return {
    user,
    accessToken: createAccessToken({ userId: user.id, role: user.role }),
  };
}

export async function login(email: string, password: string) {
  const userWithPassword = await prisma.user.findUnique({ where: { email } });

  if (!userWithPassword) {
    await verifyAgainstDummyHash(password);
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const passwordMatches = await verifyPassword(password, userWithPassword.passwordHash);
  if (!passwordMatches || !userWithPassword.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userWithPassword.id },
    select: publicUserSelect,
  });

  return {
    user,
    accessToken: createAccessToken({ userId: user.id, role: user.role }),
  };
}
