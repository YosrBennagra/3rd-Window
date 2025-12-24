/**
 * Persistence Type Definitions
 * 
 * TypeScript mirrors of Rust persistence types from src-tauri/src/persistence/schemas.rs
 * These types represent the versioned, explicit persistence contracts.
 * 
 * CRITICAL: Keep in sync with Rust definitions!
 */

// ============================================================================
// SCHEMA VERSION
// ============================================================================

/**
 * Current schema version - must match Rust CURRENT_VERSION
 */
export const CURRENT_SCHEMA_VERSION = 1;

// ============================================================================
// TOP-LEVEL PERSISTED STATE
// ============================================================================

/**
 * Complete persisted state with versioning
 * 
 * This is the root persistence object that gets saved/loaded.
 */
export interface PersistedState {
  /** Schema version for migration support */
  version: number;
  
  /** Application window and monitor settings */
  appSettings: AppSettingsV1;
  
  /** Grid layout and widget positions */
  layout: LayoutStateV1;
  
  /** User preferences and UI settings */
  preferences: PreferencesV1;
}

// ============================================================================
// APP SETTINGS V1
// ============================================================================

/**
 * Application window and monitor settings (V1)
 */
export interface AppSettingsV1 {
  /** Whether the app is in fullscreen mode */
  isFullscreen: boolean;
  
  /** Selected monitor index */
  selectedMonitor: number;
  
  /** Whether window is always on top */
  alwaysOnTop: boolean;
  
  /** Last known window position (for restoration) */
  windowPosition: WindowPosition | null;
}

export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// LAYOUT STATE V1
// ============================================================================

/**
 * Grid layout and widget positioning (V1)
 */
export interface LayoutStateV1 {
  /** Grid configuration */
  grid: GridConfig;
  
  /** Widget layouts on the grid */
  widgets: WidgetLayout[];
}

export interface GridConfig {
  columns: number;
  rows: number;
}

export interface WidgetLayout {
  /** Unique widget instance ID */
  id: string;
  
  /** Widget type (e.g., "clock", "timer", "network-monitor") */
  widgetType: string;
  
  /** Grid position */
  x: number;
  y: number;
  
  /** Grid size */
  width: number;
  height: number;
  
  /** Whether widget is locked */
  locked: boolean;
  
  /** Widget-specific settings (opaque) */
  settings?: Record<string, unknown>;
}

// ============================================================================
// PREFERENCES V1
// ============================================================================

/**
 * User preferences and UI settings (V1)
 */
export interface PreferencesV1 {
  /** UI theme */
  theme: 'light' | 'dark' | 'auto';
  
  /** Power saving mode enabled */
  powerSaving: boolean;
  
  /** Metrics refresh interval (milliseconds) */
  refreshInterval: number;
  
  /** Widget visibility overrides */
  widgetVisibility: Record<string, boolean>;
  
  /** Widget scale overrides */
  widgetScale: Record<string, 'small' | 'medium' | 'large'>;
  
  /** Widget rendering order */
  widgetOrder: string[];
  
  /** Alert rules */
  alertRules: AlertRule[];
  
  /** User notes */
  notes: string;
}

export interface AlertRule {
  id: string;
  metric: string;
  operator: string;
  threshold: number;
  enabled: boolean;
}

// ============================================================================
// RECOVERY METADATA
// ============================================================================

/**
 * Recovery mode indicates how state was recovered
 */
export type RecoveryMode = 'Clean' | 'Sanitized' | 'Partial' | 'Reset';

/**
 * Recovery information returned from load operation
 */
export interface RecoveryInfo {
  mode: RecoveryMode;
  warnings: string[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  version: CURRENT_SCHEMA_VERSION,
  appSettings: {
    isFullscreen: false,
    selectedMonitor: 0,
    alwaysOnTop: false,
    windowPosition: null,
  },
  layout: {
    grid: { columns: 24, rows: 12 },
    widgets: [],
  },
  preferences: {
    theme: 'auto',
    powerSaving: false,
    refreshInterval: 8000,
    widgetVisibility: {},
    widgetScale: {},
    widgetOrder: [],
    alertRules: [],
    notes: '',
  },
};
