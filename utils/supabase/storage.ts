import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseStorageClient: SupabaseClient | null = null;

export function getSupabaseStorageClient(): SupabaseClient {
  if (supabaseStorageClient) return supabaseStorageClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase storage environment variables are missing.");
  }

  supabaseStorageClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseStorageClient;
}
