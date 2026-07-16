import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      clientCode: true,
      name: true,
      email: true,
      phone: true,
      secondaryPhone: true,
      address: true,
      country: true,
    },
  });
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, ...rest } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // clientCode is intentionally never accepted from the request body — it's
  // immutable once assigned at account creation.
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...rest, email },
    select: {
      id: true,
      clientCode: true,
      name: true,
      email: true,
      phone: true,
      secondaryPhone: true,
      address: true,
      country: true,
    },
  });

  return NextResponse.json({ client: updated });
}
