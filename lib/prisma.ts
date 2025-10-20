// Prisma client singleton for Next.js (avoids hot-reload multiple instances)
import type { PrismaClient as PrismaClientType } from "@prisma/client";

let prisma: PrismaClientType | undefined = (global as any).prisma;

if (!prisma) {
  const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => PrismaClientType };
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    (global as any).prisma = prisma;
  }
}

export { prisma };
