import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const reassignSchema = z.object({
  orderId: z.string().uuid(),
  newClientId: z.string().uuid(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reassignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId, newClientId, note } = parsed.data;

  const [order, newClient] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.user.findUnique({ where: { id: newClientId } }),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!newClient || newClient.role !== "CLIENT") {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  if (order.clientId === newClientId) {
    return NextResponse.json({ error: "Order is already assigned to this client" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { clientId: newClientId, lastUpdatedById: session.user.id },
    });

    await tx.orderLog.create({
      data: {
        orderId,
        agentId: session.user.id,
        action: "CLIENT_REASSIGNED",
        fromClientId: order.client.id,
        fromClientName: order.client.name,
        toClientId: newClient.id,
        toClientName: newClient.name,
        note,
      },
    });

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
