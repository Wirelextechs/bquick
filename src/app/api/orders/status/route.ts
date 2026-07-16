import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidTransition, STATUS_TIMESTAMP_FIELD } from "@/lib/orderStatus";

const updateStatusSchema = z
  .object({
    orderId: z.string().uuid(),
    newStatus: z.nativeEnum(OrderStatus),
    note: z.string().optional(),
    estimatedArrival: z.string().datetime().optional(),
  })
  .refine((data) => data.newStatus !== "IN_TRANSIT" || !!data.estimatedArrival, {
    message: "Estimated arrival is required when marking a shipment as shipped",
    path: ["estimatedArrival"],
  });

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["AGENT", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Re-check isActive at request time so a mid-session suspension is enforced immediately.
  const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actingUser || !actingUser.isActive) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId, newStatus, note, estimatedArrival } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!isValidTransition(order.status, newStatus)) {
    return NextResponse.json(
      { error: `Cannot move order from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[newStatus];

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        lastUpdatedById: actingUser.id,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        ...(estimatedArrival ? { estimatedArrival: new Date(estimatedArrival) } : {}),
      },
    });

    await tx.orderLog.create({
      data: {
        orderId,
        agentId: actingUser.id,
        fromStatus: order.status,
        toStatus: newStatus,
        note,
      },
    });

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
