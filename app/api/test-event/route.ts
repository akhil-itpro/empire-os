import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_EVENTS, type ClientEvent } from "@/lib/analytics/events";
import { getSessionUserId } from "@/lib/server/session";
import { TEST_MODE, testStore } from "@/lib/server/test-mode";

// Local test mode only: records browser analytics events in the in-memory database,
// the way the browser inserts them into Supabase in real use. 404 everywhere else.
export async function POST(request: NextRequest) {
  if (!TEST_MODE) return new NextResponse("Not found", { status: 404 });
  const body = (await request.json().catch(() => null)) as { name?: unknown; props?: unknown } | null;
  if (!body || !CLIENT_EVENTS.includes(body.name as ClientEvent)) return new NextResponse(null, { status: 204 });
  const props: Record<string, string | number | boolean> = {};
  if (body.props && typeof body.props === "object") {
    for (const [k, v] of Object.entries(body.props).slice(0, 10)) {
      if (["string", "number", "boolean"].includes(typeof v)) props[k.slice(0, 40)] = typeof v === "string" ? v.slice(0, 80) : (v as number | boolean);
    }
  }
  await testStore().logEvent(body.name as ClientEvent, await getSessionUserId(), props);
  return new NextResponse(null, { status: 204 });
}
