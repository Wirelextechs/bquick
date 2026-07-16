import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  agentLocation: z.enum(["ABROAD", "GHANA"]),
});

// Agents can only view their own profile (read-only) — only an admin can
// edit an agent's details, and only after the agent requests the change
// out of band. This is the sole write path for agent profile fields.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== "AGENT") {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { email } = parsed.data;
  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== id) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const agent = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, agentLocation: true },
  });

  return NextResponse.json({ agent });
}
