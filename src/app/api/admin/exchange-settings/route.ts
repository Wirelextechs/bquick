import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  momoNumber: z.string().min(1),
  momoName: z.string().min(1),
  whatsappNumber: z.string().optional(),
  callNumber: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = {
    momoNumber: parsed.data.momoNumber,
    momoName: parsed.data.momoName,
    whatsappNumber: parsed.data.whatsappNumber || null,
    callNumber: parsed.data.callNumber || null,
    updatedById: session.user.id,
  };

  const settings = await prisma.exchangePaymentSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ settings });
}
