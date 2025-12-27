import { invoke } from '@tauri-apps/api/core';
import type { Monitor } from '@domain/models/system';
import { isTauriRuntime } from './runtime';

/**
 * Monitor Service (Zustand Architecture Best Practice)
 * 
 * This service handles monitor enumeration and queries.
 * Follows Zustand principles:
 * - Stores must not call IPC directly
 * - Side effects are isolated in services
 * - Service methods are explicit and testable
 */

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
