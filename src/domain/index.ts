/**
 * Widget Contract System - Public API
 * 
 * This is the main entry point for the widget contract system.
 * Import from this file to access all widget-related types and utilities.
 */

// ============================================================================
// CORE CONTRACTS
// ============================================================================

export type {
  WidgetId,
  WidgetCategory,
  WidgetMode,
  WidgetSizeConstraints,
  WidgetLifecycleContext,
  WidgetLifecycleHooks,
  WidgetPersistence,
  WidgetIntent,
  WidgetIntentHandler,
  WidgetComponentProps,
  WidgetComponent,
  WidgetContract,
  WidgetContractValidation,
  WidgetErrorBoundaryProps,
} from './contracts/WidgetContract';

export { WidgetSizePresets, validateWidgetContract, isWidgetContract } from './contracts/WidgetContract';

// ============================================================================
// WIDGET CONTRACTS
// ============================================================================

export {
  WIDGET_CONTRACTS,
  getAllWidgetContracts,
  getWidgetContract,
  // Individual contracts
  ClockWidgetContract,
  TimerWidgetContract,
  NotesWidgetContract,
  QuickLinksWidgetContract,
  TemperatureWidgetContract,
  RamUsageWidgetContract,
  DiskUsageWidgetContract,
  NetworkMonitorWidgetContract,
  ActivityWidgetContract,
  ImageWidgetContract,
  VideoWidgetContract,
  PDFWidgetContract,
} from './contracts/widgetContracts';

// ============================================================================
// REGISTRY
// ============================================================================

export {
  contractWidgetRegistry,
  ContractBasedWidgetRegistry,
} from './registries/ContractWidgetRegistry';

export type { RegistrationResult, WidgetQuery, RegistryStats } from './registries/ContractWidgetRegistry';

// ============================================================================
// LIFECYCLE
// ============================================================================

export { widgetLifecycleManager, WidgetLifecycleManager } from '../application/services/widgetLifecycle';

export type { LifecycleEvent } from '../application/services/widgetLifecycle';

// ============================================================================
// ADAPTERS
// ============================================================================

export {
  createWidgetAdapter,
  legacyToContract,
  createWidgetContract,
  convertLegacyWidgets,
} from './adapters/widgetAdapter.tsx';

export type { LegacyWidgetDefinition } from './adapters/widgetAdapter.tsx';

// ============================================================================
// INITIALIZATION
// ============================================================================

export { initializeWidgetSystem, shutdownWidgetSystem, getWidgetSystemHealth } from './init/widgetSystem';
