import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditOrder } from "@/lib/orderPermissions";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  weightKg: z.number().positive().nullable().optional(),
  value: z.number().positive().nullable().optional(),
});

const editOrderSchema = z.object({
  trackingCode: z.string().min(1).optional(),
  originCountry: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  weightKg: z.number().positive().nullable().optional(),
  declaredValue: z.number().positive().nullable().optional(),
  items: z.array(itemSchema).optional(),
  note: z.string().optional(),
});

const EDITABLE_FIELD_LABELS: Record<string, string> = {
  trackingCode: "tracking code",
  originCountry: "origin country",
  description: "description",
  weightKg: "weight",
  declaredValue: "declared value",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, photos: true, client: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (session.user.role === "CLIENT" && order.clientId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!canEditOrder(session.user, order)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = editOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items, note, ...fields } = parsed.data;

  if (fields.trackingCode && fields.trackingCode !== order.trackingCode) {
    const existing = await prisma.order.findUnique({
      where: { trackingCode: fields.trackingCode },
    });
    if (existing) {
      return NextResponse.json({ error: "Tracking code already in use" }, { status: 409 });
    }
  }

  const changedFields = Object.entries(fields)
    .filter(([key, value]) => value !== undefined && value !== (order as Record<string, unknown>)[key])
    .map(([key]) => EDITABLE_FIELD_LABELS[key] ?? key);
  if (items) changedFields.push("itemized goods");

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { ...fields, lastUpdatedById: session.user.id },
    });

    if (items) {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: id,
            description: item.description,
            quantity: item.quantity,
            weightKg: item.weightKg ?? undefined,
            value: item.value ?? undefined,
          })),
        });
      }
    }

    if (changedFields.length > 0) {
      await tx.orderLog.create({
        data: {
          orderId: id,
          agentId: session.user.id,
          action: "DETAILS_EDITED",
          note: [`Updated: ${changedFields.join(", ")}`, note].filter(Boolean).join(" · "),
        },
      });
    }

    return updatedOrder;
  });

  return NextResponse.json({ order: updated });
}
