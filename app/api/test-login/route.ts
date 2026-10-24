import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { TEST_MODE, TEST_USER_COOKIE, testStore } from "@/lib/server/test-mode";

// Local test mode only: signs in a new pretend founder for automated tests.
// In any other mode (and always in production) this route doesn't exist.
export async function GET(request: NextRequest) {
  if (!TEST_MODE) return new NextResponse("Not found", { status: 404 });
  const id = crypto.randomUUID();
  (await cookies()).set(TEST_USER_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  testStore().founders.add(id);
  return NextResponse.redirect(new URL("/founder", request.url));
}
