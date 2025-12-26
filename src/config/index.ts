/**
 * Configuration Module
 * 
 * Centralized configuration for application behavior, widget definitions,
 * and plugin system bootstrap.
 * 
 * @module @config
 * 
 * @example
 * ```typescript
 * import { registerCoreWidgets, getCoreWidgetsList } from '@config';
 * 
 * // Initialize widget plugin system
 * registerCoreWidgets();
 * 
 * // Get all registered widget metadata
 * const widgets = getCoreWidgetsList();
 * console.log(`Loaded ${widgets.length} widgets`);
 * ```
 */

// Widget Plugin Bootstrap
export { 
  /** Initialize and register all core widgets with the plugin system */
  registerCoreWidgets,
  /** Get metadata for all registered widgets */
  getCoreWidgetsList,
  /** Check if a widget type is registered */
  isWidgetRegistered,
  /** Get a specific widget plugin by type ID */
  getWidgetPlugin,
} from './widgetPluginBootstrap';

// Widget Configuration
/** Legacy widget definitions (use plugin system instead) */
export { widgetDefinitions } from './widgets';
