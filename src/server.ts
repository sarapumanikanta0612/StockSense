import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function start(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;

  const server = app.listen(env.PORT, () => {
    console.log(`StockSense API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received; shutting down`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(async (error: unknown) => {
  console.error("Failed to start StockSense API", error);
  await prisma.$disconnect();
  process.exit(1);
});
