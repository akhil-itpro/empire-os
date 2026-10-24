import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TEST_MODE, TEST_USER_COOKIE } from "./test-mode";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The signed-in user's id, read from the verified session on the server.
 * Never take a user id from the browser.
 */
export async function getSessionUserId(): Promise<string | null> {
  if (TEST_MODE) {
    const id = (await cookies()).get(TEST_USER_COOKIE)?.value;
    return id && UUID.test(id) ? id : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}
