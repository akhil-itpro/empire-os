import { NextResponse } from "next/server";
import { storeForRequest } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";

// "Download my data": every record linked to the signed-in user, as a JSON file.
// If any part can't be read, nothing is sent: a partial file would look complete.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await storeForRequest().exportUser(userId);
  } catch (error) {
    console.error("Data export failed", error);
    return NextResponse.json(
      { error: "We couldn't collect all of your data just now, so nothing was downloaded. Try again in a minute." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body = JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="empire-os-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
