// Typed Prisma singleton. Shares the same global instance as the legacy
// src/lib/db.js (both read globalThis.prisma), so there is only ever one client.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
