/**
 * IPC Command Service
 * 
 * Centralized, typed wrapper around all Tauri IPC commands.
 * Provides validation, type safety, error handling, and performance tracking.
 * 
 * Following IPC Contract Principles:
 * - Contract-First Communication: All calls are explicitly typed
 * - Validation & Security: Inputs validated before sending
 * - Error Propagation: Structured errors with context
 * - Performance Tracking: Monitor IPC call frequency and duration
 * - No Direct Invocation: Components use this service, not raw invoke()
 */

import { invoke } from '@tauri-apps/api/core';
import { trackIpcCall } from '@utils/performanceMonitoring';
import type {
  AppSettings,
  Monitor,
  WidgetWindowConfig,
  SystemMetrics,
  NetworkStats,
  ActiveWindowInfo,
  MoveToMonitorRequest,
  ApplyFullscreenRequest,
  UpdateWidgetPositionRequest,
  UpdateWidgetSizeRequest,
  CloseDesktopWidgetRequest,
  MonitorsResponse,
  WidgetsResponse,
  VoidResponse,
} from '../../types/ipc';

// ============================================================================
// PERFORMANCE-TRACKED INVOKE WRAPPER
// ============================================================================

/**
 * Wrapper around invoke that tracks performance metrics
 */
async function trackedInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await invoke<T>(command, args);
    const duration = performance.now() - startTime;
    trackIpcCall(command, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackIpcCall(`${command}_ERROR`, duration);
    throw error;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate widget ID format
 */
function validateWidgetId(widgetId: string): void {
  if (!widgetId || typeof widgetId !== 'string') {
    throw new Error('Invalid widgetId: must be a non-empty string');
  }
  if (widgetId.length > 100) {
    throw new Error('Invalid widgetId: too long (max 100 characters)');
  }
}

/**
 * Validate monitor index
 */
function validateMonitorIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Invalid monitor index: must be a non-negative integer');
  }
  if (index > 10) {
    throw new Error('Invalid monitor index: exceeds reasonable limit');
  }
}

/**
 * Validate coordinates
 */
function validateCoordinates(x: number, y: number): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Invalid coordinates: must be finite numbers');
  }
  if (Math.abs(x) > 100000 || Math.abs(y) > 100000) {
    throw new Error('Invalid coordinates: out of reasonable range');
  }
}

/**
 * Validate dimensions
 */
function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Invalid dimensions: must be integers');
  }
  if (width <= 0 || height <= 0) {
    throw new Error('Invalid dimensions: must be positive');
  }
  if (width > 10000 || height > 10000) {
    throw new Error('Invalid dimensions: exceed reasonable maximum');
  }
}

/**
 * Validate widget config
 */
function validateWidgetConfig(config: WidgetWindowConfig): void {
  validateWidgetId(config.widgetId);
  
  if (!config.widgetType || typeof config.widgetType !== 'string') {
    throw new Error('Invalid widgetType: must be a non-empty string');
  }
  
  validateCoordinates(config.x, config.y);
  validateDimensions(config.width, config.height);
  
  if (config.monitorIndex !== undefined) {
    validateMonitorIndex(config.monitorIndex);
  }
}

// ============================================================================
// SETTINGS COMMANDS
// ============================================================================

export const SettingsCommands = {
  /**
   * Save application settings to persistent storage
   */
  async save(settings: AppSettings): Promise<VoidResponse> {
    if (typeof settings.isFullscreen !== 'boolean') {
      throw new Error('Invalid settings: isFullscreen must be boolean');
    }
    validateMonitorIndex(settings.selectedMonitor);
    
    return await trackedInvoke('save_settings', { settings });
  },

  /**
   * Load application settings from persistent storage
   */
  async load(): Promise<AppSettings> {
    return await trackedInvoke<AppSettings>('load_settings');
  },
};

// ============================================================================
// WINDOW COMMANDS
// ============================================================================

export const WindowCommands = {
  /**
   * Toggle fullscreen state of main window
   */
  async toggleFullscreen(): Promise<boolean> {
    return await trackedInvoke<boolean>('toggle_fullscreen');
  },

  /**
   * Apply specific fullscreen state
   */
  async applyFullscreen(request: ApplyFullscreenRequest): Promise<VoidResponse> {
    if (typeof request.fullscreen !== 'boolean') {
      throw new Error('Invalid request: fullscreen must be boolean');
    }
    
    return await trackedInvoke('apply_fullscreen', { 
      fullscreen: request.fullscreen,
      targetWindow: request.targetWindow || 'main',
    });
  },

  /**
   * Move window to specified monitor
   */
  async moveToMonitor(request: MoveToMonitorRequest): Promise<VoidResponse> {
    validateMonitorIndex(request.monitorIndex);
    
    return await trackedInvoke('move_to_monitor', { 
      monitorIndex: request.monitorIndex,
      targetWindow: request.targetWindow || 'main',
    });
  },

  /**
   * Open system clock/calendar
   */
  async openSystemClock(): Promise<VoidResponse> {
    return await trackedInvoke('open_system_clock');
  },
};

// ============================================================================
// MONITOR COMMANDS
// ============================================================================

export const MonitorCommands = {
  /**
   * Get list of available monitors
   */
  async getMonitors(): Promise<MonitorsResponse> {
    return await trackedInvoke<Monitor[]>('get_monitors');
  },
};

// ============================================================================
// WIDGET COMMANDS
// ============================================================================

export const WidgetCommands = {
  /**
   * Spawn a new desktop widget window
   */
  async spawn(config: WidgetWindowConfig): Promise<string> {
    validateWidgetConfig(config);
    
    return await trackedInvoke<string>('spawn_desktop_widget', { config });
  },

  /**
   * Close an existing desktop widget window
   */
  async close(request: CloseDesktopWidgetRequest): Promise<VoidResponse> {
    validateWidgetId(request.widgetId);
    
    return await trackedInvoke('close_desktop_widget', { widgetId: request.widgetId });
  },

  /**
   * Minimize an existing desktop widget window
   */
  async minimize(widgetId: string): Promise<VoidResponse> {
    validateWidgetId(widgetId);
    
    return await trackedInvoke('minimize_desktop_widget', { widgetId });
  },

  /**
   * Set opacity for a desktop widget window
   */
  async setOpacity(widgetId: string, opacity: number): Promise<VoidResponse> {
    validateWidgetId(widgetId);
    
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
      throw new Error('Invalid opacity: must be a number between 0 and 1');
    }
    
    return await trackedInvoke('set_widget_opacity', { widgetId, opacity });
  },

  /**
   * Update desktop widget position
   */
  async updatePosition(request: UpdateWidgetPositionRequest): Promise<VoidResponse> {
    validateWidgetId(request.widgetId);
    validateCoordinates(request.x, request.y);
    
    return await trackedInvoke('update_widget_position', {
      widgetId: request.widgetId,
      x: request.x,
      y: request.y,
    });
  },

  /**
   * Update desktop widget size
   */
  async updateSize(request: UpdateWidgetSizeRequest): Promise<VoidResponse> {
    validateWidgetId(request.widgetId);
    validateDimensions(request.width, request.height);
    
    return await trackedInvoke('update_widget_size', {
      widgetId: request.widgetId,
      width: request.width,
      height: request.height,
    });
  },

  /**
   * Get list of active desktop widgets
   */
  async list(): Promise<WidgetsResponse> {
    return await trackedInvoke<WidgetWindowConfig[]>('get_desktop_widgets');
  },
};

// ============================================================================
// SYSTEM METRICS COMMANDS
// ============================================================================

export const MetricsCommands = {
  /**
   * Get current system metrics snapshot
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    return await trackedInvoke<SystemMetrics>('get_system_metrics');
  },

  /**
   * Get current network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    return await trackedInvoke<NetworkStats>('get_network_stats');
  },

  /**
   * Get system temperature readings
   */
  async getSystemTemps(): Promise<{ cpu: number; gpu: number }> {
    return await trackedInvoke<{ cpu: number; gpu: number }>('get_system_temps');
  },

  /**
   * Get system uptime in seconds
   */
  async getSystemUptime(): Promise<number> {
    return await trackedInvoke<number>('get_system_uptime');
  },

  /**
   * Get currently active window information
   */
  async getActiveWindow(): Promise<ActiveWindowInfo> {
    return await trackedInvoke<ActiveWindowInfo>('get_active_window_info');
  },
};

// ============================================================================
// CONTEXT MENU COMMANDS (Windows only)
// ============================================================================

export const ContextMenuCommands = {
  /**
   * Enable Windows 11 context menu integration
   */
  async enable(): Promise<VoidResponse> {
    return await trackedInvoke('enable_context_menu');
  },

  /**
   * Disable Windows 11 context menu integration
   */
  async disable(): Promise<VoidResponse> {
    return await trackedInvoke('disable_context_menu');
  },

  /**
   * Check if context menu integration is installed
   */
  async checkInstalled(): Promise<boolean> {
    return await trackedInvoke<boolean>('check_context_menu_installed');
  },
};

// ============================================================================
// SHELL COMMANDS
// ============================================================================

const ShellCommands = {
  /**
   * Open URL or file path in default application
   */
  async open(path: string): Promise<void> {
    return await trackedInvoke('plugin:shell|open', { path });
  },
};

// ============================================================================
// UNIFIED IPC SERVICE
// ============================================================================

/**
 * Unified IPC service providing typed access to all Tauri commands
 */
export const IpcService = {
  settings: SettingsCommands,
  window: WindowCommands,
  monitor: MonitorCommands,
  widget: WidgetCommands,
  metrics: MetricsCommands,
  contextMenu: ContextMenuCommands,
  shell: ShellCommands,
} as const;
