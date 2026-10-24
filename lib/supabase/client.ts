import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** The browser client: sign-in and reading the student's own rows (RLS applies). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
