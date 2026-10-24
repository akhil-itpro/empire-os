import { NextResponse } from "next/server";
import { storeForRequest } from "@/lib/server/deps";
import { getSessionUserId } from "@/lib/server/session";

// "Download my data": every record linked to the signed-in user, as a JSON file.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });
  const data = await storeForRequest().exportUser(userId);
  const body = JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="empire-os-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
