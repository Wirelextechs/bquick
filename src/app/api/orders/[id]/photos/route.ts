import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditOrder } from "@/lib/orderPermissions";
import { saveOrderPhoto, InvalidUploadError } from "@/lib/storage";

const MAX_FILES_PER_REQUEST = 6;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!canEditOrder(session.user, order)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Upload at most ${MAX_FILES_PER_REQUEST} photos at a time` },
      { status: 400 }
    );
  }

  try {
    const photos = await Promise.all(
      files.map(async (file) => {
        const url = await saveOrderPhoto(orderId, file);
        return prisma.orderPhoto.create({
          data: { orderId, url, uploadedById: session.user.id },
        });
      })
    );
    return NextResponse.json({ photos }, { status: 201 });
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
