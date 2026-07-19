import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateExchangeReferenceCode } from "@/lib/exchangeCode";
import { saveExchangeProof, saveRecipientQr, InvalidUploadError } from "@/lib/exchangeStorage";

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX_OPEN_REQUESTS = 3;

const guestExchangeSchema = z
  .object({
    guestName: z.string().min(1, "Name is required"),
    amountGHS: z.coerce.number().positive(),
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

// Public, unauthenticated endpoint: a "fast request" widget on the landing
// page for people who don't want to create an account. Everything (fields +
// proof/QR files) is submitted in one multipart request, unlike the
// authenticated dashboard's create-then-upload flow, since there's no
// session to come back to for a follow-up call.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  // Honeypot: real visitors never see or fill this hidden field. If it's
  // non-empty, silently pretend success instead of creating a row — don't
  // tip the bot off that it was caught.
  const honeypot = formData.get("companyWebsite");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ referenceCode: "EX-0000-000000" }, { status: 201 });
  }

  const rawFields = Object.fromEntries(
    [
      "guestName",
      "amountGHS",
      "paymentMethod",
      "paymentRef",
      "payerMomoName",
      "payerMomoNumber",
      "payerBankName",
      "payerBankAccountNumber",
      "payerBankAccountName",
      "recipientMethod",
      "recipientDetails",
      "contactPhone",
    ].map((key) => [key, formData.get(key)])
  );
  const parsed = guestExchangeSchema.safeParse(rawFields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const proofFile = formData.get("proof");
  if (!(proofFile instanceof File)) {
    return NextResponse.json({ error: "Payment proof is required" }, { status: 400 });
  }
  let recipientQrFile: File | null = null;
  if (data.recipientMethod === "ALIPAY_QR") {
    const file = formData.get("recipientQr");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Recipient's Alipay QR code is required" }, { status: 400 });
    }
    recipientQrFile = file;
  }

  const recentOpenRequests = await prisma.exchangeTransaction.count({
    where: {
      requesterRole: "GUEST",
      contactPhone: data.contactPhone,
      status: { in: ["PENDING", "PROCESSING"] },
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });
  if (recentOpenRequests >= RATE_LIMIT_MAX_OPEN_REQUESTS) {
    return NextResponse.json(
      {
        error:
          "You already have several pending requests with this number. Please wait for one to complete, or reach us on WhatsApp.",
      },
      { status: 429 }
    );
  }

  const latestRate = await prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latestRate) {
    return NextResponse.json({ error: "Exchange rate not configured yet" }, { status: 400 });
  }

  const referenceCode = await generateExchangeReferenceCode();
  const amountRMB = data.amountGHS * Number(latestRate.rate);

  const exchange = await prisma.exchangeTransaction.create({
    data: {
      referenceCode,
      requesterRole: "GUEST",
      guestName: data.guestName,
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

  try {
    const proofUrl = await saveExchangeProof(exchange.id, proofFile);
    const recipientQrUrl = recipientQrFile ? await saveRecipientQr(exchange.id, recipientQrFile) : undefined;
    await prisma.exchangeTransaction.update({
      where: { id: exchange.id },
      data: { proofUrl, ...(recipientQrUrl ? { recipientQrUrl } : {}) },
    });
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ referenceCode }, { status: 201 });
}
