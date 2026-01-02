import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Prevent multiple instances in development (hot reload)
// and ensure single instance in production
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

// Log slow queries in development (> 100ms)
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 100) {
      console.warn(`Slow query (${e.duration}ms):`, e.query.substring(0, 200));
    }
  });
}

// Always store in global to prevent multiple instances
// This is critical for serverless/edge environments
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
const handleShutdown = async () => {
  await prisma.$disconnect();
};

// Handle different shutdown signals
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", handleShutdown);
}

export default prisma;
