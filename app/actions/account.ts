"use server";

import { cookies } from "next/headers";
import { storeForRequest, TIME_TRAVEL_COOKIE } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";
import { TEST_MODE, TEST_USER_COOKIE } from "@/lib/server/test-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Deletes the signed-in user's login and every record linked to them, after they
 * type DELETE. Checks afterwards that nothing is left and reports the true result.
 */
export async function deleteAccount(confirmation: unknown) {
  if (confirmation !== "DELETE") {
    return { ok: false as const, message: "Type DELETE in capitals to confirm." };
  }
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, message: "Your session ended. Sign in again to delete your account." };

  const store = storeForRequest();
  await store.deleteUser(userId);
  if (await store.userExists(userId)) {
    return { ok: false as const, message: "Something went wrong and your account wasn't fully deleted. Please try again or contact us." };
  }

  const jar = await cookies();
  jar.delete(TIME_TRAVEL_COOKIE);
  if (TEST_MODE) {
    jar.delete(TEST_USER_COOKIE);
  } else {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // The login is already gone; the session cookie is cleared either way.
    }
  }
  return { ok: true as const };
}
