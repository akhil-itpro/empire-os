// Our own analytics: one row in the `events` table per funnel step. No third-party
// trackers. Props hold step numbers and labels only, never answers, names or emails.
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ClientEvent =
  | "landing_view"
  | "quiz_start"
  | "quiz_step"
  | "quiz_complete"
  | "reveal_view"
  | "oath_done"
  | "paywall_view"
  | "reserve_click"
  | "pack_locked_tap"
  | "share_card_created"
  | "share_click"
  | "referral_visit"
  | "install_tip_view";

const ANON_KEY = "empire.anon";

function anonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function track(name: ClientEvent, props: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;
  client ??= createSupabaseBrowserClient();
  const c = client;
  void (async () => {
    try {
      const { data } = await c.auth.getSession();
      await c.from("events").insert({
        name,
        props,
        anon_id: anonId(),
        user_id: data.session?.user.id ?? null,
      });
    } catch {
      // Analytics never gets in the student's way.
    }
  })();
}
