import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: existing } = await supabase.storage.listBuckets();
if (existing?.some((b) => b.name === "order-photos")) {
  console.log("Bucket 'order-photos' already exists.");
  process.exit(0);
}

const { error } = await supabase.storage.createBucket("order-photos", {
  public: true,
  fileSizeLimit: "5MB",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log("Created bucket 'order-photos' (public).");
