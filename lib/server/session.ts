import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The signed-in user's id, read from the verified session on the server.
 * Never take a user id from the browser.
 */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}
