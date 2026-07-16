import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "order-photos";

const photos = await prisma.orderPhoto.findMany();
console.log(`Found ${photos.length} photo record(s) to migrate.`);

for (const photo of photos) {
  if (!photo.url.startsWith("/uploads/")) {
    console.log(`Skipping ${photo.id} — already migrated (${photo.url})`);
    continue;
  }

  const localPath = path.join(process.cwd(), "public", photo.url);
  const objectPath = photo.url.replace(/^\/uploads\//, "");
  const ext = path.extname(localPath).slice(1) || "bin";
  const contentType = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[ext] ?? "application/octet-stream";

  const buffer = await readFile(localPath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, { contentType, upsert: true });

  if (uploadError) {
    console.error(`Failed to upload ${photo.id}:`, uploadError.message);
    continue;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  await prisma.orderPhoto.update({ where: { id: photo.id }, data: { url: data.publicUrl } });
  console.log(`Migrated ${photo.id} -> ${data.publicUrl}`);
}

await prisma.$disconnect();
