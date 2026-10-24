import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during server rendering and hydration, true once the page is live in the
 * browser. Read browser-only things (like localStorage) only when this is true,
 * so the server and the first browser render match.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
