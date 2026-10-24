import "server-only";
import { MemoryStore } from "./store-memory";

/**
 * Local test mode: an in-memory database and a pretend sign-in, so every screen
 * can be built and tested before Supabase exists, and so Playwright tests don't
 * touch real data. It is impossible in production: a production build always
 * has NODE_ENV "production", and EMPIRE_TEST_MODE is never set on Vercel.
 */
export const TEST_MODE = process.env.NODE_ENV !== "production" && process.env.EMPIRE_TEST_MODE === "1";

export const TEST_USER_COOKIE = "empire_test_user";

const globalForTest = globalThis as unknown as { empireTestStore?: MemoryStore };

/** One shared in-memory store for the dev server process. */
export function testStore(): MemoryStore {
  if (!TEST_MODE) throw new Error("testStore() is only available in local test mode.");
  globalForTest.empireTestStore ??= new MemoryStore();
  return globalForTest.empireTestStore;
}
