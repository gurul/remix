/**
 * Runs when the Next server starts. Patches broken server-side localStorage
 * (e.g. when Node is run with --localstorage-file but no valid path, e.g. from Cursor)
 * so Next's dev overlay code doesn't crash with "getItem is not a function".
 */
export function register() {
  if (typeof globalThis.localStorage !== "undefined") {
    const ls = globalThis.localStorage as Storage & { getItem?: unknown };
    if (typeof ls.getItem !== "function") {
      const noop = () => {};
      const stub = (): string | null => null;
      Object.defineProperties(globalThis, {
        localStorage: {
          value: {
            getItem: stub,
            setItem: noop,
            removeItem: noop,
            clear: noop,
            key: stub,
            get length() {
              return 0;
            },
          },
          writable: true,
          configurable: true,
        },
      });
    }
  }
}
