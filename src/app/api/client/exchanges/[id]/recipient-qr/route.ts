import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveRecipientQr, InvalidUploadError } from "@/lib/exchangeStorage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exchange = await prisma.exchangeTransaction.findUnique({ where: { id } });
  if (!exchange || exchange.clientId !== session.user.id) {
    return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  }
  if (exchange.status !== "PENDING") {
    return NextResponse.json(
      { error: "Recipient QR can only be uploaded while the request is pending" },
      { status: 400 }
    );
  }
  if (exchange.recipientMethod !== "ALIPAY_QR") {
    return NextResponse.json(
      { error: "This request is set to receive typed recipient details, not a QR code" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const url = await saveRecipientQr(exchange.id, file);
    const updated = await prisma.exchangeTransaction.update({
      where: { id: exchange.id },
      data: { recipientQrUrl: url },
    });
    return NextResponse.json({ exchange: updated });
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
