/**
 * IPC Module Exports
 * 
 * Centralized exports for IPC contracts and services.
 * Import from this file for clean, consistent access.
 */

// Type contracts
export type {
  AppSettings,
  Monitor,
  MonitorSize,
  MonitorPosition,
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
  IpcError,
} from '../../types/ipc';

// Error utilities
export { isIpcError, formatIpcError } from '../../types/ipc';

// IPC service (default export)
export { default as IpcService } from '../../services/ipc';

// Named command exports for convenience
export {
  SettingsCommands,
  WindowCommands,
  MonitorCommands,
  WidgetCommands,
  MetricsCommands,
  ContextMenuCommands,
} from '../../services/ipc';
