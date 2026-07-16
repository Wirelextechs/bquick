import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_TIMESTAMP_FIELD } from "@/lib/orderStatus";

const overrideSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.nativeEnum(OrderStatus),
  note: z.string().min(1, "A reason is required for a manual status override"),
});

// Admin-only correction tool: unlike /api/orders/status, this allows setting
// any status (including moving backward) to fix a mistaken update.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId, newStatus, note } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === newStatus) {
    return NextResponse.json({ error: "Order already has this status" }, { status: 400 });
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[newStatus];

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        lastUpdatedById: session.user.id,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
      },
    });

    await tx.orderLog.create({
      data: {
        orderId,
        agentId: session.user.id,
        fromStatus: order.status,
        toStatus: newStatus,
        note: `[Manual override] ${note}`,
      },
    });

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
