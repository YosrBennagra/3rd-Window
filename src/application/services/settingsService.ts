import { IpcService } from './ipc';
import type { AppSettings } from '../../types/ipc';
import { isTauriRuntime } from './runtime';

/**
 * Settings Service (Zustand Architecture Best Practice)
 * 
 * This service handles ALL side effects related to settings.
 * Follows Zustand principles:
 * - Stores must not perform side effects directly
 * - IPC coordination belongs in application services
 * - Side effects are explicit and testable
 * 
 * The store calls these service methods instead of invoking Tauri directly.
 * 
 * Updated to use centralized IPC service with validation and type safety.
 */

/**
 * Apply fullscreen mode to window
 */
export async function applyFullscreen(fullscreen: boolean): Promise<void> {
  if (!isTauriRuntime()) {
    console.warn('[SettingsService] Tauri runtime not available, skipping apply_fullscreen');
    return;
  }
  
  console.info('[SettingsService] applying fullscreen:', fullscreen);
  await IpcService.window.applyFullscreen({ fullscreen });
}

/**
 * Move window to specific monitor
 */
export async function moveToMonitor(monitorIndex: number): Promise<void> {
  if (!isTauriRuntime()) {
    console.warn('[SettingsService] Tauri runtime not available, skipping move_to_monitor');
    return;
  }
  
  console.info('[SettingsService] moving to monitor:', monitorIndex);
  await IpcService.window.moveToMonitor({ monitorIndex });
}

/**
 * Save settings to persistent storage
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isTauriRuntime()) {
    console.warn('[SettingsService] Tauri runtime not available, skipping save_settings');
    return;
  }
  
  console.info('[SettingsService] saving settings:', settings);
  await IpcService.settings.save(settings);
}

/**
 * Load settings from persistent storage
 */
export async function loadSettings(): Promise<AppSettings> {
  if (!isTauriRuntime()) {
    console.warn('[SettingsService] Tauri runtime not available, returning defaults');
    throw new Error('Tauri runtime not available');
  }
  
  console.info('[SettingsService] loading settings');
  return await IpcService.settings.load();
}

/**
 * Orchestrate fullscreen change with proper sequencing
 * 
 * This encapsulates the complex side-effect coordination that was in the store.
 */
export async function setFullscreenWithPersistence(
  fullscreen: boolean,
  currentSettings: AppSettings
): Promise<AppSettings> {
  const newSettings = { ...currentSettings, isFullscreen: fullscreen };
  
  // Apply fullscreen immediately
  await applyFullscreen(fullscreen);
  
  // Save updated settings
  await saveSettings(newSettings);
  
  return newSettings;
}

/**
 * Orchestrate monitor change with fullscreen handling
 * 
 * This encapsulates the complex sequencing that was in the store:
 * 1. Exit fullscreen if active
 * 2. Move to new monitor
 * 3. Re-enter fullscreen if it was active
 * 4. Save settings
 */
export async function changeMonitorWithFullscreen(
  monitorIndex: number,
  currentSettings: AppSettings
): Promise<AppSettings> {
  const newSettings = { ...currentSettings, selectedMonitor: monitorIndex };
  const wasFullscreen = currentSettings.isFullscreen;
  
  // Exit fullscreen first to prevent broken layout
  if (wasFullscreen) {
    await applyFullscreen(false);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Move to new monitor
  await moveToMonitor(monitorIndex);
  
  // Wait for window to settle
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Re-enter fullscreen if it was enabled (adapts to new monitor size)
  if (wasFullscreen) {
    await applyFullscreen(true);
  }
  
  // Save updated settings
  await saveSettings(newSettings);
  
  return newSettings;
}

/**
 * Initialize settings on app startup
 * 
 * Handles the complex startup sequence that was in the store.
 */
export async function initializeSettings(): Promise<AppSettings> {
  const settings = await loadSettings();
  
  // Move to saved monitor first
  await moveToMonitor(settings.selectedMonitor);
  
  // Wait for window to settle
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Apply fullscreen if it was saved
  if (settings.isFullscreen) {
    await applyFullscreen(true);
  }
  
  return settings;
}
