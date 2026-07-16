import { prisma } from "@/lib/prisma";

// Format: QL-{year}-{6 random alphanumeric}, regenerated on collision.
export async function generateTrackingCode(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `QL-${year}-${suffix}`;
    const existing = await prisma.order.findUnique({
      where: { trackingCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique tracking code");
}
