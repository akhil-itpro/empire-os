import { afterEach, describe, expect, it, vi } from "vitest";

describe("local test mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is off in a production build, even if the switch is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMPIRE_TEST_MODE", "1");
    const { TEST_MODE, testStore } = await import("@/lib/server/test-mode");
    expect(TEST_MODE).toBe(false);
    expect(() => testStore()).toThrow();
  });

  it("is off by default in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMPIRE_TEST_MODE", "");
    const { TEST_MODE } = await import("@/lib/server/test-mode");
    expect(TEST_MODE).toBe(false);
  });

  it("is on only in development with the switch set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMPIRE_TEST_MODE", "1");
    const { TEST_MODE } = await import("@/lib/server/test-mode");
    expect(TEST_MODE).toBe(true);
  });
});
