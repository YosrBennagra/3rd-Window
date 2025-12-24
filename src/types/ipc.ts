/**
 * IPC Contract Types
 * 
 * TypeScript mirrors of Rust IPC types from src-tauri/src/ipc_types.rs
 * These types represent the explicit contracts between frontend and backend.
 * 
 * IMPORTANT: Keep in sync with Rust definitions!
 * Any changes here must be reflected in ipc_types.rs and vice versa.
 */

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * Application settings persisted across sessions
 */
export interface AppSettings {
  isFullscreen: boolean;
  selectedMonitor: number;
}

// ============================================================================
// MONITOR TYPES
// ============================================================================

/**
 * Physical display monitor information
 */
export interface Monitor {
  identifier: string | null;
  name: string;
  size: MonitorSize;
  position: MonitorPosition;
  isPrimary: boolean;
  scaleFactor: number;
  refreshRate: number | null;
}

export interface MonitorSize {
  width: number;
  height: number;
}

export interface MonitorPosition {
  x: number;
  y: number;
}

// ============================================================================
// WIDGET WINDOW TYPES
// ============================================================================

/**
 * Configuration for spawning a desktop widget window
 */
export interface WidgetWindowConfig {
  widgetId: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  monitorIndex?: number;
}

// ============================================================================
// SYSTEM METRICS TYPES
// ============================================================================

/**
 * System performance metrics snapshot
 */
export interface SystemMetrics {
  cpuUsage: number;
  cpuTemp: number;
  gpuTemp: number;
  memoryUsed: number;
  memoryTotal: number;
}

/**
 * Network interface statistics
 */
export interface NetworkStats {
  interfaceName: string;
  downloadSpeed: number;
  uploadSpeed: number;
  totalDownloaded: number;
  totalUploaded: number;
  isConnected: boolean;
}

// ============================================================================
// WINDOW TRACKER TYPES
// ============================================================================

/**
 * Information about the currently active OS window
 */
export interface ActiveWindowInfo {
  name: string;
  duration: number;
}

// ============================================================================
// COMMAND REQUEST TYPES
// ============================================================================

/**
 * Request to move window to a different monitor
 */
export interface MoveToMonitorRequest {
  monitorIndex: number;
}

/**
 * Request to apply fullscreen state
 */
export interface ApplyFullscreenRequest {
  fullscreen: boolean;
}

/**
 * Request to update widget position
 */
export interface UpdateWidgetPositionRequest {
  widgetId: string;
  x: number;
  y: number;
}

/**
 * Request to update widget size
 */
export interface UpdateWidgetSizeRequest {
  widgetId: string;
  width: number;
  height: number;
}

/**
 * Request to close a desktop widget
 */
export interface CloseDesktopWidgetRequest {
  widgetId: string;
}

// ============================================================================
// COMMAND RESPONSE TYPES
// ============================================================================

/**
 * Response from toggle_fullscreen command
 */
export interface ToggleFullscreenResponse {
  newState: boolean;
}

/**
 * Standard void response (operation succeeded)
 */
export type VoidResponse = void;

/**
 * List of available monitors
 */
export type MonitorsResponse = Monitor[];

/**
 * List of active desktop widgets
 */
export type WidgetsResponse = WidgetWindowConfig[];

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Structured IPC error from backend
 */
export interface IpcError {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
}

/**
 * Type guard to check if an error is an IPC error
 */
export function isIpcError(error: unknown): error is IpcError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as IpcError).message === 'string'
  );
}

/**
 * Convert unknown error to user-safe message
 */
export function formatIpcError(error: unknown): string {
  if (isIpcError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
