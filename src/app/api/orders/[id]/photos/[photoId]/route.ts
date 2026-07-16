import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditOrder } from "@/lib/orderPermissions";
import { deleteOrderPhoto } from "@/lib/storage";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId, photoId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!canEditOrder(session.user, order)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const photo = await prisma.orderPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.orderId !== orderId) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await prisma.orderPhoto.delete({ where: { id: photoId } });
  await deleteOrderPhoto(photo.url);

  return NextResponse.json({ success: true });
}
