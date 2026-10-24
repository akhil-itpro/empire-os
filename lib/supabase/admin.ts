import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * A Supabase client with the secret key. It bypasses row-level security, so it is
 * used only in server code AFTER checking the signed-in user and validating input.
 * "server-only" makes the build fail if this file is ever imported into the browser.
 */
export function createSupabaseAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY is missing from .env.local.");
  }
  return createClient<Database>(supabaseUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
