import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key (bypasses RLS). Never import
// this from a client component — only from API routes / server code.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const ORDER_PHOTOS_BUCKET = "order-photos";
export const EXCHANGE_PROOFS_BUCKET = "exchange-proofs";
