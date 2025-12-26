/**
 * Window Service (Clean Architecture + Zustand Best Practice)
 * 
 * This service handles window-related side effects, keeping stores pure.
 * Stores delegate to this service instead of calling Tauri directly.
 * 
 * Following principles:
 * - No Side Effects in Stores: Stores call this service, not IPC directly
 * - Single Responsibility: Window operations centralized here
 * - Testable: Can be mocked for tests
 */

import IpcService from '../../services/ipc';

/**
 * Set always-on-top for main window
 */
export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  // Using dynamic import to keep bundle size small
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('set_always_on_top', { enabled });
}

/**
 * Set fullscreen mode for main window
 */
export async function setFullscreen(fullscreen: boolean): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('set_fullscreen', { fullscreen });
}

/**
 * Get current window position
 */
export async function getWindowPosition(): Promise<{ x: number; y: number }> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  const position = await window.outerPosition();
  return { x: position.x, y: position.y };
}

/**
 * Set window position
 */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  const { PhysicalPosition } = await import('@tauri-apps/api/window');
  await window.setPosition(new PhysicalPosition(x, y));
}
