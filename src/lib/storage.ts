import { randomUUID } from "crypto";
import { supabaseAdmin, ORDER_PHOTOS_BUCKET } from "./supabaseAdmin";

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class InvalidUploadError extends Error {}

// Supabase Storage-backed adapter. Callers only depend on
// saveOrderPhoto/deleteOrderPhoto, so the backing store can change later
// without touching the API routes that call these.
export async function saveOrderPhoto(orderId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidUploadError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new InvalidUploadError("File is larger than 5MB");
  }

  const ext = file.type.split("/")[1] ?? "bin";
  const objectPath = `orders/${orderId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(ORDER_PHOTOS_BUCKET)
    .upload(objectPath, buffer, { contentType: file.type, upsert: false });

  if (error) {
    throw new InvalidUploadError(`Upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(ORDER_PHOTOS_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function deleteOrderPhoto(url: string): Promise<void> {
  const marker = `/${ORDER_PHOTOS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const objectPath = url.slice(index + marker.length);
  await supabaseAdmin.storage.from(ORDER_PHOTOS_BUCKET).remove([objectPath]).catch(() => {});
}
