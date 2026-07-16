import { randomUUID } from "crypto";
import { supabaseAdmin, EXCHANGE_PROOFS_BUCKET } from "./supabaseAdmin";
import { MAX_FILE_BYTES, ALLOWED_TYPES, InvalidUploadError } from "./storage";

export { InvalidUploadError };

// Supabase Storage-backed adapter for exchange-related images: the client's
// payment-proof screenshot/QR, and the recipient's Alipay/payment QR code.
// Sibling to storage.ts (different bucket/path rules) rather than a shared
// generic function, but reuses its upload constants to avoid drift.
async function uploadExchangeImage(exchangeId: string, kind: "proof" | "recipient-qr", file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidUploadError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new InvalidUploadError("File is larger than 5MB");
  }

  const ext = file.type.split("/")[1] ?? "bin";
  const objectPath = `exchanges/${exchangeId}/${kind}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(EXCHANGE_PROOFS_BUCKET)
    .upload(objectPath, buffer, { contentType: file.type, upsert: false });

  if (error) {
    throw new InvalidUploadError(`Upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(EXCHANGE_PROOFS_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export function saveExchangeProof(exchangeId: string, file: File): Promise<string> {
  return uploadExchangeImage(exchangeId, "proof", file);
}

export function saveRecipientQr(exchangeId: string, file: File): Promise<string> {
  return uploadExchangeImage(exchangeId, "recipient-qr", file);
}

export async function deleteExchangeProof(url: string): Promise<void> {
  const marker = `/${EXCHANGE_PROOFS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const objectPath = url.slice(index + marker.length);
  await supabaseAdmin.storage.from(EXCHANGE_PROOFS_BUCKET).remove([objectPath]).catch(() => {});
}
