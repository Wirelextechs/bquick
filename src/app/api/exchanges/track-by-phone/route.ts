import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public, unauthenticated lookup for guests who lost their reference code.
// Scoped to requesterRole = GUEST only — a registered client's exchange
// history must stay behind their login, never discoverable by phone number
// alone. Only summary fields are returned; full detail lives behind the
// individual /track/[referenceCode] page.
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) {
    return NextResponse.json({ error: "A phone number is required" }, { status: 400 });
  }

  const exchanges = await prisma.exchangeTransaction.findMany({
    where: {
      requesterRole: "GUEST",
      OR: [{ contactPhone: phone }, { payerMomoNumber: phone }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      referenceCode: true,
      status: true,
      amountGHS: true,
      amountRMB: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ exchanges });
}
