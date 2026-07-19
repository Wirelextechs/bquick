import { PrismaClient, Prisma } from "@prisma/client";

// Supabase's pooler (both session and transaction mode) has shown genuine
// intermittent connection drops from this app's network paths — not a
// one-time fluke, reproduced repeatedly during development. Retrying a
// dropped connection almost always succeeds within a second, so every query
// gets a couple of short-backoff retries before surfacing an error, instead
// of one blip failing the request (e.g. turning a real click into a
// "nothing happened" login failure or a slow/stuck page).
const RETRY_DELAYS_MS = [300, 800];

function isConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001 can't reach server, P1002 timed out, P1008 op timed out, P1017 closed
    return ["P1001", "P1002", "P1008", "P1017"].includes(err.code);
  }
  return false;
}

function createPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            if (attempt >= RETRY_DELAYS_MS.length || !isConnectionError(err)) throw err;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          }
        }
      },
    },
  });
}

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
