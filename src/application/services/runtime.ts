/**
 * Runtime detection helpers shared by services that need to guard Tauri APIs.
 * Cached result avoids repeated DOM lookups.
 */
type TauriCandidateWindow = {
  __TAURI__?: { invoke?: unknown; core?: { invoke?: unknown } };
  __TAURI_IPC__?: unknown;
  __TAURI_INTERNALS__?: { invoke?: unknown; invokeHandler?: unknown };
};

const detectTauriRuntime = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const candidate = window as unknown as TauriCandidateWindow;
  return (
    typeof candidate.__TAURI_IPC__ === 'function' ||
    typeof candidate.__TAURI__?.invoke === 'function' ||
    typeof candidate.__TAURI__?.core?.invoke === 'function' ||
    typeof candidate.__TAURI_INTERNALS__?.invoke === 'function' ||
    typeof candidate.__TAURI_INTERNALS__?.invokeHandler === 'function'
  );
};

/**
 * Determine whether we are running inside a Tauri runtime.
 * Result is cached after the first check.
 */
export const isTauriRuntime = (() => {
  let cached: boolean | null = null;
  return () => {
    if (cached === null) {
      cached = detectTauriRuntime();
    }
    return cached;
  };
})();
