/**
 * Widget Contract Design (Production-Grade Widget System)
 * 
 * This file defines the MANDATORY contract that ALL widgets must implement.
 * Widgets are first-class domain units governed by explicit interfaces and lifecycle rules.
 * 
 * Core Principles:
 * - Contract-First Design: Every widget declares an explicit contract
 * - Isolation by Default: Widgets don't know about other widgets or global state
 * - Replaceability: Any widget can be removed/swapped without side effects
 */

import type { ComponentType, ReactNode } from 'react';

// ============================================================================
// IDENTITY
// ============================================================================

/**
 * Stable, unique widget identifier
 */
export type WidgetId = string;

/**
 * Widget categories for organization
 */
export type WidgetCategory =
  | 'system'       // CPU, RAM, Disk, Network, Temperature
  | 'utility'      // Clock, Timer, Notes, Links
  | 'media'        // Image, Video, PDF, Music
  | 'productivity' // Calendar, Tasks, Clipboard
  | 'monitoring'   // Activity, Logs, Processes
  | 'integration'  // GitHub, Discord, Slack
  | 'finance'      // Crypto, Stocks
  | 'security'     // Password Vault, Secure Notes
  | 'developer'    // API Tester, Log Viewer
  | 'other';

/**
 * Supported widget deployment modes
 */
export type WidgetMode = 'dashboard' | 'desktop' | 'both';

// ============================================================================
// SIZING RULES
// ============================================================================

/**
 * Widget size constraints (in grid units)
 */
export interface WidgetSizeConstraints {
  /** Minimum width in grid cells */
  minWidth: number;
  /** Minimum height in grid cells */
  minHeight: number;
  /** Maximum width in grid cells */
  maxWidth: number;
  /** Maximum height in grid cells */
  maxHeight: number;
  /** Default width when first added */
  defaultWidth: number;
  /** Default height when first added */
  defaultHeight: number;
  /** Whether widget can be resized */
  resizable: boolean;
  /** Optional aspect ratio constraint (width:height) */
  aspectRatio?: number;
  /** If true, widget always maintains fixed size */
  fixed?: boolean;
}

/**
 * Widget size behavior presets
 */
export const WidgetSizePresets = {
  /** Small fixed widget (2x2) */
  SMALL_FIXED: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 2,
    maxHeight: 2,
    defaultWidth: 2,
    defaultHeight: 2,
    resizable: false,
    fixed: true,
  },
  /** Medium fixed widget (3x3) */
  MEDIUM_FIXED: {
    minWidth: 3,
    minHeight: 3,
    maxWidth: 3,
    maxHeight: 3,
    defaultWidth: 3,
    defaultHeight: 3,
    resizable: false,
    fixed: true,
  },
  /** Large flexible widget */
  LARGE_FLEXIBLE: {
    minWidth: 4,
    minHeight: 4,
    maxWidth: 12,
    maxHeight: 12,
    defaultWidth: 6,
    defaultHeight: 6,
    resizable: true,
    fixed: false,
  },
  /** Compact system monitor */
  COMPACT_MONITOR: {
    minWidth: 3,
    minHeight: 3,
    maxWidth: 4,
    maxHeight: 6,
    defaultWidth: 3,
    defaultHeight: 4,
    resizable: true,
    fixed: false,
  },
} as const satisfies Record<string, WidgetSizeConstraints>;

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

/**
 * Widget lifecycle context provided to hooks
 */
export interface WidgetLifecycleContext {
  /** Widget's unique instance ID */
  widgetId: string;
  /** Widget type identifier */
  widgetType: string;
  /** Current widget settings */
  settings: Record<string, unknown>;
  /** Current size in grid units */
  size: { width: number; height: number };
  /** Widget mode (dashboard/desktop) */
  mode: WidgetMode;
}

/**
 * Widget lifecycle hooks (all optional)
 */
export interface WidgetLifecycleHooks {
  /**
   * Called once when widget is created (before mounting)
   * Use for: Initial validation, default settings normalization
   * Must not: Perform side effects, mutate external state
   */
  onInitialize?: (context: WidgetLifecycleContext) => void | Promise<void>;

  /**
   * Called when widget is mounted to DOM
   * Use for: Starting timers, subscriptions, data fetching
   * Must: Clean up in onUnmount
   */
  onMount?: (context: WidgetLifecycleContext) => void | Promise<void>;

  /**
   * Called when widget size changes
   * Use for: Adjusting layout, recomputing sizes
   * Must: Be deterministic and fast
   */
  onResize?: (context: WidgetLifecycleContext, newSize: { width: number; height: number }) => void;

  /**
   * Called when widget settings change
   * Use for: Reacting to user configuration updates
   */
  onSettingsChange?: (context: WidgetLifecycleContext, newSettings: Record<string, unknown>) => void;

  /**
   * Called when widget is about to unmount
   * Use for: Cleanup - timers, listeners, subscriptions
   * Must: Clean up ALL resources created in onMount
   */
  onUnmount?: (context: WidgetLifecycleContext) => void | Promise<void>;

  /**
   * Called when widget encounters an error
   * Use for: Error recovery, logging
   */
  onError?: (context: WidgetLifecycleContext, error: Error) => void;
}

// ============================================================================
// PERSISTENCE DEFINITION
// ============================================================================

/**
 * Widget persistence contract
 * Explicitly defines what gets saved vs what's runtime-only
 */
export interface WidgetPersistence {
  /** Fields that should be persisted */
  persistedFields: string[];
  /** Fields that are runtime-only (never saved) */
  runtimeFields: string[];
  /** Version for migration support */
  version: number;
  /** Optional migration function for settings */
  migrate?: (oldSettings: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
}

// ============================================================================
// WIDGET INTENTS (Events, not mutations)
// ============================================================================

/**
 * Widget intents - events emitted by widgets
 * Widgets emit intents/events, they do NOT mutate state directly
 */
export type WidgetIntent =
  | { type: 'request-resize'; width: number; height: number }
  | { type: 'request-remove' }
  | { type: 'request-settings-change'; settings: Record<string, unknown> }
  | { type: 'request-spawn-desktop'; }
  | { type: 'open-external-link'; url: string }
  | { type: 'show-notification'; message: string; severity: 'info' | 'warning' | 'error' }
  | { type: 'custom'; payload: unknown };

/**
 * Widget intent handler
 */
export type WidgetIntentHandler = (intent: WidgetIntent) => void;

// ============================================================================
// WIDGET COMPONENT INTERFACE
// ============================================================================

/**
 * Props that ALL widget components receive
 */
export interface WidgetComponentProps {
  /** Widget instance ID */
  widgetId: string;
  /** Current size in grid units */
  size: { width: number; height: number };
  /** Current settings (immutable) */
  settings: Record<string, unknown>;
  /** Widget mode */
  mode: WidgetMode;
  /** Intent handler for widget events */
  onIntent?: WidgetIntentHandler;
  /** Whether widget is in preview mode */
  isPreview?: boolean;
}

/**
 * Widget component type
 */
export type WidgetComponent = ComponentType<WidgetComponentProps>;

// ============================================================================
// MANDATORY WIDGET CONTRACT
// ============================================================================

/**
 * The complete widget contract that EVERY widget must implement
 */
export interface WidgetContract {
  // ──────────────────────────────────────────────────────────────────────
  // IDENTITY (Required)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Stable, unique widget ID (kebab-case) */
  id: WidgetId;
  
  /** Display name shown to users */
  displayName: string;
  
  /** Widget category for organization */
  category: WidgetCategory;
  
  // ──────────────────────────────────────────────────────────────────────
  // METADATA (Required)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Brief description of widget purpose */
  description: string;
  
  /** Supported deployment modes */
  supportedModes: WidgetMode[];
  
  /** Widget version for compatibility checks */
  version: string;
  
  /** Optional icon (emoji or icon name) */
  icon?: string;
  
  /** Whether widget is currently available */
  enabled?: boolean;
  
  // ──────────────────────────────────────────────────────────────────────
  // SIZING RULES (Required)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Size constraints and behavior */
  sizeConstraints: WidgetSizeConstraints;
  
  // ──────────────────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS (Optional)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Lifecycle hooks */
  lifecycle?: WidgetLifecycleHooks;
  
  // ──────────────────────────────────────────────────────────────────────
  // PERSISTENCE (Required)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Persistence definition */
  persistence: WidgetPersistence;
  
  /** Default settings for new instances */
  defaultSettings: Record<string, unknown>;
  
  // ──────────────────────────────────────────────────────────────────────
  // COMPONENT (Required)
  // ──────────────────────────────────────────────────────────────────────
  
  /** React component that renders the widget */
  component: WidgetComponent;
  
  /** Optional settings panel component */
  settingsComponent?: ComponentType<{
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
  }>;
  
  // ──────────────────────────────────────────────────────────────────────
  // VALIDATION (Optional)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Validate settings before applying */
  validateSettings?: (settings: Record<string, unknown>) => {
    valid: boolean;
    errors?: string[];
  };
  
  // ──────────────────────────────────────────────────────────────────────
  // CAPABILITIES (Optional)
  // ──────────────────────────────────────────────────────────────────────
  
  /** Capabilities flags */
  capabilities?: {
    /** Can spawn as desktop widget */
    canSpawnDesktop?: boolean;
    /** Requires network access */
    requiresNetwork?: boolean;
    /** Requires system permissions */
    requiresPermissions?: string[];
    /** Can work offline */
    offline?: boolean;
  };
}

// ============================================================================
// CONTRACT VALIDATION
// ============================================================================

/**
 * Validation result for widget contract compliance
 */
export interface WidgetContractValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a widget contract for compliance
 * Ensures widgets meet all mandatory requirements
 */
export function validateWidgetContract(contract: Partial<WidgetContract>): WidgetContractValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validateIdentity = () => {
    if (!contract.id || typeof contract.id !== 'string') {
      errors.push('Widget must have a valid string ID');
    } else if (!/^[a-z0-9-]+$/.test(contract.id)) {
      errors.push('Widget ID must be kebab-case (lowercase, numbers, hyphens only)');
    }

    if (!contract.displayName || typeof contract.displayName !== 'string') {
      errors.push('Widget must have a displayName');
    }

    if (!contract.category) {
      errors.push('Widget must have a category');
    }
  };

  const validateMetadata = () => {
    if (!contract.description) {
      errors.push('Widget must have a description');
    }

    if (!contract.supportedModes || contract.supportedModes.length === 0) {
      errors.push('Widget must declare at least one supported mode');
    }

    if (!contract.version) {
      warnings.push('Widget should have a version string');
    }
  };

  const validateSizing = () => {
    if (!contract.sizeConstraints) {
      errors.push('Widget must define sizeConstraints');
      return;
    }
    const { minWidth, minHeight, maxWidth, maxHeight, defaultWidth, defaultHeight } = contract.sizeConstraints;
    if (minWidth < 1 || minHeight < 1) {
      errors.push('Widget minWidth and minHeight must be at least 1');
    }
    if (maxWidth < minWidth || maxHeight < minHeight) {
      errors.push('Widget maxWidth/maxHeight must be >= minWidth/minHeight');
    }
    if (defaultWidth < minWidth || defaultWidth > maxWidth) {
      errors.push('Widget defaultWidth must be between minWidth and maxWidth');
    }
    if (defaultHeight < minHeight || defaultHeight > maxHeight) {
      errors.push('Widget defaultHeight must be between minHeight and maxHeight');
    }
  };

  const validatePersistence = () => {
    if (!contract.persistence) {
      errors.push('Widget must define persistence contract');
      return;
    }
    if (!Array.isArray(contract.persistence.persistedFields)) {
      errors.push('Widget persistence.persistedFields must be an array');
    }
    if (!Array.isArray(contract.persistence.runtimeFields)) {
      errors.push('Widget persistence.runtimeFields must be an array');
    }
    if (typeof contract.persistence.version !== 'number') {
      errors.push('Widget persistence.version must be a number');
    }
  };

  const validateComponentAndLifecycle = () => {
    if (!contract.defaultSettings || typeof contract.defaultSettings !== 'object') {
      errors.push('Widget must provide defaultSettings');
    }

    if (!contract.component || typeof contract.component !== 'function') {
      errors.push('Widget must provide a component');
    }

    if (contract.lifecycle) {
      const hooks = contract.lifecycle;
      if (hooks.onMount && !hooks.onUnmount) {
        warnings.push('Widget has onMount but no onUnmount - may leak resources');
      }
    }
  };

  validateIdentity();
  validateMetadata();
  validateSizing();
  validatePersistence();
  validateComponentAndLifecycle();

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// WIDGET ERROR BOUNDARY
// ============================================================================

/**
 * Error boundary component for widgets
 * Prevents widget crashes from affecting the entire app
 */
export interface WidgetErrorBoundaryProps {
  widgetId: string;
  widgetType: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: unknown) => void;
  fallback?: ReactNode;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a valid widget contract
 */
export function isWidgetContract(obj: unknown): obj is WidgetContract {
  if (!obj || typeof obj !== 'object') return false;
  const validation = validateWidgetContract(obj as Partial<WidgetContract>);
  return validation.valid;
}
