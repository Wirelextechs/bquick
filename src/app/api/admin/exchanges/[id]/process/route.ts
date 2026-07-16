import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ note: z.string().optional() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exchange = await prisma.exchangeTransaction.findUnique({ where: { id } });
  if (!exchange) {
    return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  }
  if (exchange.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending requests can move to processing" },
      { status: 400 }
    );
  }

  const [, , updated] = await prisma.$transaction([
    prisma.exchangeTransaction.update({
      where: { id },
      data: {
        status: "PROCESSING",
        processedById: session.user.id,
        processedAt: new Date(),
        processingNote: parsed.data.note ?? null,
      },
    }),
    prisma.exchangeLog.create({
      data: {
        exchangeId: id,
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        fromStatus: "PENDING",
        toStatus: "PROCESSING",
        note: parsed.data.note,
      },
    }),
    prisma.exchangeTransaction.findUnique({ where: { id } }),
  ]);

  return NextResponse.json({ exchange: updated });
}
