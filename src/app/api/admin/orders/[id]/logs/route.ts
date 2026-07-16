import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const logs = await prisma.orderLog.findMany({
    where: { orderId: id },
    include: { agent: { select: { name: true, role: true } } },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json({ logs });
}
