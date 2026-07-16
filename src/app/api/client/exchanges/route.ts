import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateExchangeReferenceCode } from "@/lib/exchangeCode";

const createExchangeSchema = z
  .object({
    amountGHS: z.number().positive(),
    paymentMethod: z.enum(["MOMO", "BANK"]),
    paymentRef: z.string().min(1),
    payerMomoName: z.string().optional(),
    payerMomoNumber: z.string().optional(),
    payerBankName: z.string().optional(),
    payerBankAccountNumber: z.string().optional(),
    payerBankAccountName: z.string().optional(),
    recipientMethod: z.enum(["ACCOUNT_DETAILS", "ALIPAY_QR"]),
    recipientDetails: z.string().optional(),
    contactPhone: z.string().min(1),
  })
  .refine(
    (data) => data.recipientMethod !== "ACCOUNT_DETAILS" || !!data.recipientDetails?.trim(),
    { message: "Recipient details are required", path: ["recipientDetails"] }
  )
  .refine(
    (data) => data.paymentMethod !== "MOMO" || (!!data.payerMomoName?.trim() && !!data.payerMomoNumber?.trim()),
    { message: "Name and number on the paying MoMo account are required", path: ["payerMomoName"] }
  )
  .refine(
    (data) =>
      data.paymentMethod !== "BANK" ||
      (!!data.payerBankName?.trim() && !!data.payerBankAccountNumber?.trim() && !!data.payerBankAccountName?.trim()),
    { message: "Bank name, account number and account name are required", path: ["payerBankName"] }
  );

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exchanges = await prisma.exchangeTransaction.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ exchanges });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const latestRate = await prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latestRate) {
    return NextResponse.json({ error: "Exchange rate not configured yet" }, { status: 400 });
  }

  const referenceCode = await generateExchangeReferenceCode();
  const amountRMB = data.amountGHS * Number(latestRate.rate);

  const exchange = await prisma.exchangeTransaction.create({
    data: {
      referenceCode,
      clientId: session.user.id,
      amountGHS: data.amountGHS,
      rate: latestRate.rate,
      amountRMB,
      paymentMethod: data.paymentMethod,
      paymentRef: data.paymentRef,
      payerMomoName: data.paymentMethod === "MOMO" ? data.payerMomoName : null,
      payerMomoNumber: data.paymentMethod === "MOMO" ? data.payerMomoNumber : null,
      payerBankName: data.paymentMethod === "BANK" ? data.payerBankName : null,
      payerBankAccountNumber: data.paymentMethod === "BANK" ? data.payerBankAccountNumber : null,
      payerBankAccountName: data.paymentMethod === "BANK" ? data.payerBankAccountName : null,
      recipientMethod: data.recipientMethod,
      recipientDetails: data.recipientMethod === "ACCOUNT_DETAILS" ? data.recipientDetails : null,
      contactPhone: data.contactPhone,
    },
  });

  return NextResponse.json({ exchange }, { status: 201 });
}
