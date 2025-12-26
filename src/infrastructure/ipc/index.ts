/**
 * IPC Module - Infrastructure Layer
 * 
 * Centralized exports for IPC contracts and Tauri backend communication.
 * Provides type-safe access to all backend commands and system APIs.
 * 
 * @module @infrastructure/ipc
 * 
 * @example Type Contracts
 * ```typescript
 * import type { SystemMetrics, Monitor, AppSettings } from '@infrastructure/ipc';
 * 
 * const metrics: SystemMetrics = await IpcService.getSystemMetrics();
 * const monitors: Monitor[] = await IpcService.getMonitors();
 * ```
 * 
 * @example IPC Service
 * ```typescript
 * import { IpcService } from '@infrastructure/ipc';
 * 
 * // Fetch system metrics
 * const metrics = await IpcService.getSystemMetrics();
 * 
 * // Save settings
 * await IpcService.saveSettings(newSettings);
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * import { IpcService, isIpcError, formatIpcError } from '@infrastructure/ipc';
 * 
 * try {
 *   await IpcService.someCommand();
 * } catch (error) {
 *   if (isIpcError(error)) {
 *     console.error(formatIpcError(error));
 *   }
 * }
 * ```
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
export { IpcService } from '@application/services';

// Named command exports for convenience
export {
  SettingsCommands,
  WindowCommands,
  MonitorCommands,
  WidgetCommands,
  MetricsCommands,
  ContextMenuCommands,
} from '../../application/services/ipc';
