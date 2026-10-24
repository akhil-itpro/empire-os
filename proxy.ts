// Refreshes the Supabase session cookie before pages render (Next.js 16 "proxy",
// formerly middleware). It only keeps the session fresh; every page and server
// action still checks the user itself.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [header, value] of Object.entries(headers)) response.headers.set(header, value);
      },
    },
  });

  // Loads and, if needed, refreshes the session; the result is not used here.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Only the signed-in app and auth routes need a fresh session.
  matcher: ["/hq/:path*", "/path/:path*", "/stats/:path*", "/me/:path*", "/college/:path*", "/founder/:path*", "/auth/:path*", "/start/:path*"],
};
