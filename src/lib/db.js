// Prisma client singleton. In dev, Next.js hot-reload would otherwise
// create a new client on every reload and exhaust DB connections.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
