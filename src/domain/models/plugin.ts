/**
 * Widget Plugin System - Core Contracts (SOLID: Interface Segregation)
 * 
 * This module defines the stable, versioned contracts for the widget plugin system.
 * These interfaces define WHAT plugins can do, not HOW they work internally.
 * 
 * Design Principles (from plugin-ready-design skill):
 * 1. Core vs Extensions - Small stable core, extensible widget ecosystem
 * 2. Contracts Over Internals - Plugins use stable APIs, not internal state
 * 3. Isolation by Design - Plugin failures don't crash the app
 * 4. Versioning & Compatibility - Breaking changes are controlled
 * 5. Failure Containment - Graceful degradation on errors
 * 6. Security & Safety - Limited access by default
 */

import type { WidgetLayout, WidgetConstraints } from './layout';

/**
 * Widget Plugin API Version
 * 
 * Semantic versioning for the plugin contract:
 * - MAJOR: Breaking changes (require plugin updates)
 * - MINOR: New features (backward compatible)
 * - PATCH: Bug fixes (backward compatible)
 */
export const WIDGET_PLUGIN_API_VERSION = '1.0.0';

/**
 * Widget Plugin Metadata
 * 
 * Describes a widget plugin's identity, capabilities, and requirements.
 * This is the "business card" of a plugin.
 */
export interface WidgetPluginMetadata {
  /** Unique identifier (e.g., 'clock', 'network-monitor', 'custom-weather') */
  id: string;
  
  /** Human-readable name (e.g., 'Clock', 'Network Monitor') */
  name: string;
  
  /** Short description for widget picker */
  description: string;
  
  /** Plugin author/organization */
  author: string;
  
  /** Plugin version (semantic versioning) */
  version: string;
  
  /** Widget plugin API version this plugin targets */
  apiVersion: string;
  
  /** Optional icon (SVG string or data URL) */
  icon?: string;
  
  /** Tags for categorization/search (e.g., ['system', 'monitoring']) */
  tags?: string[];
  
  /** Minimum API version required (for compatibility checks) */
  minApiVersion?: string;
}

/**
 * Widget Plugin Configuration
 * 
 * Runtime configuration for a widget plugin.
 * Defines HOW the widget behaves in the grid system.
 */
export interface WidgetPluginConfig {
  /** Size constraints for this widget type */
  constraints: WidgetConstraints;
  
  /** Default size when added to grid (must respect constraints) */
  defaultSize: { width: number; height: number };
  
  /** Whether this widget can be resized by user */
  resizable: boolean;
  
  /** Whether this widget can be moved by user */
  movable: boolean;
  
  /** Whether this widget has settings that can be configured */
  hasSettings: boolean;
  
  /** Optional default settings for new instances */
  defaultSettings?: Record<string, unknown>;
}

/**
 * Widget Plugin Lifecycle Hooks
 * 
 * Optional callbacks for widget lifecycle events.
 * Plugins can use these to initialize resources, save state, etc.
 */
export interface WidgetPluginLifecycle {
  /** Called when widget instance is created */
  onCreate?: (widget: WidgetLayout) => void | Promise<void>;
  
  /** Called when widget instance is destroyed */
  onDestroy?: (widget: WidgetLayout) => void | Promise<void>;
  
  /** Called when widget settings are updated */
  onSettingsChange?: (widget: WidgetLayout, oldSettings: Record<string, unknown>) => void | Promise<void>;
  
  /** Called when widget is moved/resized */
  onLayoutChange?: (widget: WidgetLayout) => void | Promise<void>;
}

/**
 * Widget Plugin Settings Validator
 * 
 * Validates and sanitizes widget settings.
 * Ensures user-provided settings are safe and valid.
 */
export interface WidgetPluginSettingsValidator {
  /**
   * Validate settings object
   * @param settings - Raw settings to validate
   * @returns Validated and sanitized settings, or error message
   */
  validate: (settings: unknown) => { valid: true; settings: Record<string, unknown> } | { valid: false; error: string };
  
  /**
   * Get default settings for this widget type
   * @returns Default settings object
   */
  getDefaults: () => Record<string, unknown>;
}

/**
 * Widget Plugin Error Handler
 * 
 * Handles errors within a widget plugin.
 * Prevents widget errors from crashing the entire application.
 */
export interface WidgetPluginErrorHandler {
  /**
   * Handle a widget error
   * @param error - The error that occurred
   * @param context - Context about where the error occurred
   * @returns Recovery action or null to disable widget
   */
  handleError: (error: Error, context: WidgetErrorContext) => WidgetErrorRecovery | null;
}

/**
 * Context information about a widget error
 */
export interface WidgetErrorContext {
  /** Widget ID where error occurred */
  widgetId: string;
  
  /** Widget type */
  widgetType: string;
  
  /** Phase where error occurred */
  phase: 'initialization' | 'render' | 'update' | 'settings' | 'lifecycle';
  
  /** Additional error context */
  details?: Record<string, unknown>;
}

/**
 * Recovery action for a widget error
 */
export interface WidgetErrorRecovery {
  /** Recovery strategy */
  strategy: 'retry' | 'reset-settings' | 'disable' | 'fallback';
  
  /** Optional message to show user */
  message?: string;
  
  /** Fallback settings if strategy is 'reset-settings' */
  fallbackSettings?: Record<string, unknown>;
}

/**
 * Complete Widget Plugin Definition
 * 
 * This is the main contract that all widget plugins must implement.
 * It combines metadata, configuration, lifecycle, validation, and error handling.
 */
export interface WidgetPlugin {
  /** Plugin metadata (identity, capabilities) */
  metadata: WidgetPluginMetadata;
  
  /** Plugin configuration (constraints, defaults) */
  config: WidgetPluginConfig;
  
  /** React component that renders this widget */
  component: React.ComponentType<{ widget: WidgetLayout }>;
  
  /** Optional lifecycle hooks */
  lifecycle?: WidgetPluginLifecycle;
  
  /** Optional settings validator */
  settingsValidator?: WidgetPluginSettingsValidator;
  
  /** Optional error handler */
  errorHandler?: WidgetPluginErrorHandler;
  
  /** Optional settings editor component */
  settingsComponent?: React.ComponentType<{
    widget: WidgetLayout;
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
  }>;
}

/**
 * Widget Plugin Registration Info
 * 
 * Internal state tracked by the registry for each plugin.
 */
export interface WidgetPluginRegistration {
  /** The plugin itself */
  plugin: WidgetPlugin;
  
  /** When this plugin was registered */
  registeredAt: Date;
  
  /** Whether this plugin is currently enabled */
  enabled: boolean;
  
  /** Count of active widget instances using this plugin */
  instanceCount: number;
  
  /** Error count (for automatic disabling of faulty plugins) */
  errorCount: number;
  
  /** Last error encountered (if any) */
  lastError?: {
    error: Error;
    timestamp: Date;
    context: WidgetErrorContext;
  };
}

/**
 * Widget Plugin Registry Events
 * 
 * Events emitted by the plugin registry.
 * UI can listen to these for reactive updates.
 */
export type WidgetPluginEvent =
  | { type: 'plugin-registered'; pluginId: string }
  | { type: 'plugin-unregistered'; pluginId: string }
  | { type: 'plugin-enabled'; pluginId: string }
  | { type: 'plugin-disabled'; pluginId: string }
  | { type: 'plugin-error'; pluginId: string; error: Error; context: WidgetErrorContext };

/**
 * Widget Plugin Compatibility Result
 * 
 * Result of checking if a plugin is compatible with current API version.
 */
export interface WidgetPluginCompatibility {
  /** Whether plugin is compatible */
  compatible: boolean;
  
  /** Compatibility status */
  status: 'compatible' | 'needs-update' | 'too-old' | 'too-new';
  
  /** Human-readable message */
  message: string;
  
  /** Required action (if any) */
  action?: 'update-plugin' | 'update-app' | 'none';
}
