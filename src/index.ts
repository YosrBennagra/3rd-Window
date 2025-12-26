/**
 * ThirdScreen - Main Source Export
 * 
 * Top-level barrel export for the entire application.
 * Organizes exports by architectural layer following Clean Architecture principles.
 * 
 * Layer Structure:
 * - UI: React components and views
 * - Application: Services, stores, hooks (coordination layer)
 * - Domain: Business logic, contracts, models (core layer)
 * - Infrastructure: External integrations (IPC, persistence, system)
 * - Config: Application configuration and registries
 * - Types: TypeScript type definitions
 * - Utils: Utility functions and helpers
 * - Theme: Styling and CSS
 */

// ============================================================================
// UI LAYER
// ============================================================================

export * from './ui';

// ============================================================================
// APPLICATION LAYER
// ============================================================================

export * from './application';

// ============================================================================
// DOMAIN LAYER
// ============================================================================

export * from './domain';

// ============================================================================
// INFRASTRUCTURE LAYER
// ============================================================================

export * from './infrastructure/ipc';
export * from './infrastructure/persistence';
export * from './infrastructure/system';

// ============================================================================
// CONFIGURATION
// ============================================================================

export * from './config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Re-export types but avoid duplicates with domain layer
export type {
  // IPC Types
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
  // Branded Types (non-widget)
  MonitorId,
  Milliseconds,
  Seconds,
  AbsolutePath,
  HttpUrl,
  // Persistence Types
  PersistedState,
  AppSettingsV1,
  WindowPosition,
  LayoutStateV1,
  GridConfig,
  WidgetLayout as PersistedWidgetLayout,
  PreferencesV1,
  AlertRule,
  RecoveryMode,
  RecoveryInfo,
} from './types';

export {
  isIpcError,
  formatIpcError,
  createMonitorId,
  monitorIdToNumber,
  milliseconds,
  seconds,
  secondsToMillis,
  millisToSeconds,
  createAbsolutePath,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_PERSISTED_STATE,
} from './types';

// ============================================================================
// UTILITIES
// ============================================================================

export * from './utils';

// ============================================================================
// THEME (CSS Modules)
// ============================================================================

// Theme is imported via CSS imports, not re-exported here
// Import directly: import './theme/global.css'
