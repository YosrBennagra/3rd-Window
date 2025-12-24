import { invoke } from '@tauri-apps/api/core';
import type { Monitor } from '../../domain/models/system';

/**
 * Monitor Service (Zustand Architecture Best Practice)
 * 
 * This service handles monitor enumeration and queries.
 * Follows Zustand principles:
 * - Stores must not call IPC directly
 * - Side effects are isolated in services
 * - Service methods are explicit and testable
 */

const isTauriRuntime = (() => {
  let cached: boolean | null = null;
  return () => {
    if (cached !== null) return cached;
    if (typeof window === 'undefined') {
      cached = false;
      return cached;
    }
    const candidate = window as unknown as {
      __TAURI__?: { invoke?: unknown; core?: { invoke?: unknown } };
      __TAURI_IPC__?: unknown;
      __TAURI_INTERNALS__?: { invoke?: unknown; invokeHandler?: unknown };
    };
    cached =
      typeof candidate.__TAURI_IPC__ === 'function' ||
      typeof candidate.__TAURI__?.invoke === 'function' ||
      typeof candidate.__TAURI__?.core?.invoke === 'function' ||
      typeof candidate.__TAURI_INTERNALS__?.invoke === 'function' ||
      typeof candidate.__TAURI_INTERNALS__?.invokeHandler === 'function';
    return cached;
  };
})();

/**
 * Get list of available monitors
 */
export async function getMonitors(): Promise<Monitor[]> {
  if (!isTauriRuntime()) {
    console.warn('[MonitorService] Tauri runtime not available');
    return [];
  }
  
  console.info('[MonitorService] fetching monitors');
  const monitors = await invoke<Monitor[]>('get_monitors');
  console.info('[MonitorService] found', monitors.length, 'monitors');
  return monitors;
}

/**
 * Find primary monitor index
 */
export function findPrimaryMonitorIndex(monitors: Monitor[]): number {
  const index = monitors.findIndex((monitor) => monitor.is_primary);
  return index >= 0 ? index : 0;
}

/**
 * Validate monitor index is within bounds
 */
export function isValidMonitorIndex(index: number, monitors: Monitor[]): boolean {
  return index >= 0 && index < monitors.length;
}
