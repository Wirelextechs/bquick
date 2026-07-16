import { prisma } from "@/lib/prisma";

// Sequential, human-readable client ID: CL-000123. Falls back to a random
// suffix on collision (e.g. if a client was ever removed and re-numbered).
export async function generateClientCode(): Promise<string> {
  const clientCount = await prisma.user.count({ where: { role: "CLIENT" } });

  for (let attempt = 0; attempt < 5; attempt++) {
    const next = clientCount + 1 + attempt;
    const code = `CL-${String(next).padStart(6, "0")}`;
    const existing = await prisma.user.findUnique({ where: { clientCode: code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique client code");
}
