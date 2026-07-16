import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const trackingCode = searchParams.get("trackingCode");
  const agentId = searchParams.get("agentId");
  const date = searchParams.get("date");

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as OrderStatus;
  if (trackingCode) where.trackingCode = { contains: trackingCode, mode: "insensitive" };
  if (agentId) where.OR = [{ createdById: agentId }, { lastUpdatedById: agentId }];
  if (date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: { select: { id: true, clientCode: true, name: true, email: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      lastUpdatedBy: { select: { id: true, name: true } },
      logs: {
        include: { agent: { select: { id: true, name: true } } },
        orderBy: { timestamp: "asc" },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}
