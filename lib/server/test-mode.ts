import "server-only";
import { FakeGateway } from "./payments-fake";
import { MemoryStore } from "./store-memory";

/**
 * Local test mode: an in-memory database and a pretend sign-in, so every screen
 * can be built and tested before Supabase exists, and so Playwright tests don't
 * touch real data. It is impossible in production: a production build always
 * has NODE_ENV "production", and EMPIRE_TEST_MODE is never set on Vercel.
 */
export const TEST_MODE = process.env.NODE_ENV !== "production" && process.env.EMPIRE_TEST_MODE === "1";

export const TEST_USER_COOKIE = "empire_test_user";

/** In test mode, a browser with this cookie sees live payments through a stand-in Razorpay. */
export const TEST_PAYMENTS_COOKIE = "empire_test_payments";

const globalForTest = globalThis as unknown as { empireTestStore?: MemoryStore; empireTestGateway?: FakeGateway };

/** One shared in-memory store for the dev server process. */
export function testStore(): MemoryStore {
  if (!TEST_MODE) throw new Error("testStore() is only available in local test mode.");
  globalForTest.empireTestStore ??= new MemoryStore();
  return globalForTest.empireTestStore;
}

/** One shared stand-in Razorpay for the dev server process (test mode only). */
export function testGateway(): FakeGateway {
  if (!TEST_MODE) throw new Error("testGateway() is only available in local test mode.");
  globalForTest.empireTestGateway ??= new FakeGateway();
  return globalForTest.empireTestGateway;
}
