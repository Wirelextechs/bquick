import { prisma } from "@/lib/prisma";

// Format: EX-{year}-{6 random alphanumeric}, regenerated on collision.
export async function generateExchangeReferenceCode(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `EX-${year}-${suffix}`;
    const existing = await prisma.exchangeTransaction.findUnique({
      where: { referenceCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique exchange reference code");
}
