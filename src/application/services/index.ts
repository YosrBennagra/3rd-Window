/**
 * Application Services - Barrel Export
 * 
 * Centralized exports for all application-layer services.
 * These services coordinate between domain logic and infrastructure.
 * 
 * @module application/services
 * @example
 * ```typescript
 * import { IpcService, loadSettings, getMonitors } from '@application/services';
 * 
 * // Use IPC service
 * const metrics = await IpcService.metrics.getSystemMetrics();
 * 
 * // Load settings
 * const settings = await loadSettings();
 * 
 * // Get monitors
 * const monitors = await getMonitors();
 * ```
 */

// IPC Service - Core communication with backend
/**
 * Central IPC service for all Tauri backend communication.
 * Provides typed, validated access to all backend commands.
 * @see {@link @application/services/ipc}
 */
export { IpcService } from './ipc';

// Settings Management
/**
 * Settings management functions for persistent application configuration.
 * Handles loading, saving, and applying settings with validation.
 */
export { 
  /** Load application settings from persistent storage */
  loadSettings, 
  /** Save application settings to persistent storage */
  saveSettings, 
  /** Apply fullscreen mode to window */
  applyFullscreen,
  /** Move window to specified monitor */
  moveToMonitor,
  /** Set fullscreen with persistence */
  setFullscreenWithPersistence,
  /** Change monitor with fullscreen handling */
  changeMonitorWithFullscreen,
  /** Initialize settings on app startup */
  initializeSettings,
} from './settingsService';

// Monitor Management
export { 
  getMonitors, 
  findPrimaryMonitorIndex,
  isValidMonitorIndex,
} from './monitorService';

// Monitor Events
export type { MonitorEvent } from './monitorEvents';

// Window Management
export { 
  setAlwaysOnTop, 
  setFullscreen, 
  getWindowPosition,
  setWindowPosition,
} from './windowService';

// Widget Plugin System
export { 
  createWidgetPluginFromSimpleDescriptor,
  createWidgetPluginsFromDescriptors,
  adaptLegacyWidget,
} from './widgetPluginAdapter';
export type { SimpleWidgetDescriptor } from './widgetPluginAdapter';

// Widget State Restoration
export { 
  restoreDesktopWidgets,
  restoreSingleWidget,
} from './widgetRestoration';

