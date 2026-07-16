import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingCode } from "@/lib/trackingCode";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  weightKg: z.number().positive().optional(),
  value: z.number().positive().optional(),
});

const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  trackingCode: z.string().min(1).optional(),
  originCountry: z.string().min(1),
  description: z.string().min(1),
  weightKg: z.number().positive().optional(),
  declaredValue: z.number().positive().optional(),
  estimatedArrival: z.string().datetime().optional(),
  items: z.array(itemSchema).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["AGENT", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const client = await prisma.user.findUnique({ where: { id: data.clientId } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  if (data.trackingCode) {
    const existing = await prisma.order.findUnique({ where: { trackingCode: data.trackingCode } });
    if (existing) {
      return NextResponse.json({ error: "Tracking code already in use" }, { status: 409 });
    }
  }

  const trackingCode = data.trackingCode ?? (await generateTrackingCode());

  const order = await prisma.order.create({
    data: {
      trackingCode,
      clientId: data.clientId,
      originCountry: data.originCountry,
      description: data.description,
      weightKg: data.weightKg,
      declaredValue: data.declaredValue,
      estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : undefined,
      createdById: session.user.id,
      lastUpdatedById: session.user.id,
      items: data.items
        ? { create: data.items }
        : undefined,
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
