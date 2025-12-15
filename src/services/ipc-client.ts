// Placeholder IPC client for renderer to main process.
export async function invoke(channel: string, payload?: unknown) {
  // @ts-expect-error window.api injected by preload
  return window.api?.invoke(channel, payload);
}
