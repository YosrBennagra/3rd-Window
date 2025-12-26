/**
 * Type Definitions Module
 * 
 * Comprehensive type system for ThirdScreen including branded types,
 * IPC contracts, persistence schemas, and utility types.
 * 
 * @module @types
 * 
 * @example Branded Types
 * ```typescript
 * import { createWidgetInstanceId, createMonitorId } from '@types';
 * 
 * const widgetId = createWidgetInstanceId(); // Type-safe widget ID
 * const monitorId = createMonitorId('primary'); // Type-safe monitor ID
 * ```
 * 
 * @example IPC Contracts
 * ```typescript
 * import type { SystemMetrics, Monitor } from '@types';
 * 
 * const metrics: SystemMetrics = await IpcService.getSystemMetrics();
 * const monitors: Monitor[] = await IpcService.getMonitors();
 * ```
 */

// Branded Types (Type-Safe IDs)
export type {
  WidgetInstanceId,
  WidgetTypeId,
  AlertRuleId,
  AlertInstanceId,
  MonitorId,
  Milliseconds,
  Seconds,
  AbsolutePath,
  HttpUrl,
} from './branded';

export {
  createWidgetInstanceId,
  createWidgetTypeId,
  isValidWidgetId,
  createAlertRuleId,
  createAlertInstanceId,
  createMonitorId,
  monitorIdToNumber,
  milliseconds,
  seconds,
  secondsToMillis,
  millisToSeconds,
  createAbsolutePath,
} from './branded';

// IPC Type Contracts
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
} from './ipc';
export { isIpcError, formatIpcError } from './ipc';

// Persistence Types
export type {
  PersistedState,
  AppSettingsV1,
  WindowPosition,
  LayoutStateV1,
  GridConfig,
  WidgetLayout,
  PreferencesV1,
  AlertRule,
  RecoveryMode,
  RecoveryInfo,
} from './persistence';

export {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_PERSISTED_STATE,
} from './persistence';
