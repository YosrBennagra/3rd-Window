/**
 * Widget Plugin Adapters (SOLID: Adapter Pattern)
 * 
 * Utilities to convert existing widgets to the plugin system.
 * This allows gradual migration without breaking existing code.
 * 
 * Design Principles:
 * - Backward Compatibility: Existing widgets work without changes
 * - Gradual Migration: Convert widgets one at a time
 * - Zero Breaking Changes: Old code continues to work
 * - Type Safety: Preserve TypeScript types throughout
 */

import type { ComponentType } from 'react';
import type { WidgetLayout, WidgetConstraints } from '../../domain/models/layout';
import type {
  WidgetPlugin,
  WidgetPluginMetadata,
  WidgetPluginConfig,
  WidgetPluginSettingsValidator,
} from '../../domain/models/plugin';

/**
 * Simple Widget Descriptor
 * 
 * Minimal information needed to create a plugin from existing widget.
 */
export interface SimpleWidgetDescriptor {
  id: string;
  name: string;
  description: string;
  component: ComponentType<{ widget: WidgetLayout }> | ComponentType<{ widget?: WidgetLayout }>;
  constraints: WidgetConstraints;
  defaultSettings?: Record<string, unknown>;
  settingsValidator?: WidgetPluginSettingsValidator;
  icon?: string;
  tags?: string[];
}

/**
 * Create a widget plugin from a simple descriptor
 * 
 * This is a convenience function for creating plugins without
 * writing all the boilerplate. Perfect for existing widgets.
 * 
 * @param descriptor - Simple widget information
 * @returns Complete widget plugin
 * 
 * @example
 * ```typescript
 * const clockPlugin = createWidgetPlugin({
 *   id: 'clock',
 *   name: 'Clock',
 *   description: 'Display current time',
 *   component: ClockWidget,
 *   constraints: { minWidth: 3, minHeight: 2, maxWidth: 3, maxHeight: 2 },
 *   defaultSettings: CLOCK_WIDGET_DEFAULT_SETTINGS,
 * });
 * ```
 */
export function createWidgetPlugin(descriptor: SimpleWidgetDescriptor): WidgetPlugin {
  const metadata: WidgetPluginMetadata = {
    id: descriptor.id,
    name: descriptor.name,
    description: descriptor.description,
    author: 'ThirdScreen',
    version: '1.0.0',
    apiVersion: '1.0.0',
    icon: descriptor.icon,
    tags: descriptor.tags,
  };
  
  const config: WidgetPluginConfig = {
    constraints: descriptor.constraints,
    defaultSize: {
      width: descriptor.constraints.minWidth,
      height: descriptor.constraints.minHeight,
    },
    resizable: true,
    movable: true,
    hasSettings: descriptor.defaultSettings !== undefined,
    defaultSettings: descriptor.defaultSettings,
  };
  
  return {
    metadata,
    config,
    component: descriptor.component as ComponentType<{ widget: WidgetLayout }>,
    settingsValidator: descriptor.settingsValidator,
  };
}

/**
 * Create a settings validator from ensure* function
 * 
 * Many widgets have ensureXxxSettings functions that validate and
 * sanitize settings. This adapter wraps them in the plugin interface.
 * 
 * @param ensureFn - Function that validates settings (returns typed settings)
 * @param defaults - Default settings object
 * @returns Plugin settings validator
 * 
 * @example
 * ```typescript
 * const validator = createSettingsValidator(
 *   ensureClockWidgetSettings,
 *   CLOCK_WIDGET_DEFAULT_SETTINGS
 * );
 * ```
 */
export function createSettingsValidator<T extends Record<string, unknown>>(
  ensureFn: (settings?: unknown) => T,
  defaults: T,
): WidgetPluginSettingsValidator {
  return {
    validate: (settings: unknown) => {
      try {
        const validated = ensureFn(settings);
        return { valid: true, settings: validated as Record<string, unknown> };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Invalid settings',
        };
      }
    },
    getDefaults: () => ({ ...defaults }),
  };
}

/**
 * Batch register multiple widgets as plugins
 * 
 * Convenience function for registering many widgets at once.
 * 
 * @param registry - Plugin registry to register with
 * @param descriptors - Array of widget descriptors
 * 
 * @example
 * ```typescript
 * batchRegisterWidgets(widgetPluginRegistry, [
 *   { id: 'clock', name: 'Clock', ... },
 *   { id: 'timer', name: 'Timer', ... },
 *   { id: 'notes', name: 'Notes', ... },
 * ]);
 * ```
 */
export function batchRegisterWidgets(
  registry: { register: (plugin: WidgetPlugin) => void },
  descriptors: SimpleWidgetDescriptor[],
): void {
  for (const descriptor of descriptors) {
    try {
      const plugin = createWidgetPlugin(descriptor);
      registry.register(plugin);
    } catch (error) {
      console.error(`[PluginAdapter] Failed to register widget "${descriptor.id}":`, error);
    }
  }
}

/**
 * Get widget component from registry with fallback
 * 
 * Safely retrieves a widget component, with fallback to a default.
 * 
 * @param registry - Plugin registry
 * @param widgetType - Widget type to look up
 * @param fallback - Fallback component if widget not found
 * @returns Widget component
 */
export function getWidgetComponent(
  registry: { get: (id: string) => WidgetPlugin | undefined },
  widgetType: string,
  fallback?: ComponentType<{ widget: WidgetLayout }>,
): ComponentType<{ widget: WidgetLayout }> | undefined {
  const plugin = registry.get(widgetType);
  if (plugin) {
    return plugin.component;
  }
  
  if (fallback) {
    console.warn(`[PluginAdapter] Widget "${widgetType}" not found, using fallback`);
    return fallback;
  }
  
  console.error(`[PluginAdapter] Widget "${widgetType}" not found and no fallback provided`);
  return undefined;
}

/**
 * Get widget constraints from registry with fallback
 * 
 * @param registry - Plugin registry
 * @param widgetType - Widget type to look up
 * @param fallback - Fallback constraints if widget not found
 * @returns Widget constraints
 */
export function getWidgetConstraints(
  registry: { get: (id: string) => WidgetPlugin | undefined },
  widgetType: string,
  fallback?: WidgetConstraints,
): WidgetConstraints | undefined {
  const plugin = registry.get(widgetType);
  if (plugin) {
    return plugin.config.constraints;
  }
  
  if (fallback) {
    return fallback;
  }
  
  console.error(`[PluginAdapter] Constraints for widget "${widgetType}" not found`);
  return undefined;
}

/**
 * Get widget default settings from registry
 * 
 * @param registry - Plugin registry
 * @param widgetType - Widget type to look up
 * @returns Default settings or undefined
 */
export function getWidgetDefaultSettings(
  registry: { get: (id: string) => WidgetPlugin | undefined },
  widgetType: string,
): Record<string, unknown> | undefined {
  const plugin = registry.get(widgetType);
  if (plugin?.config.defaultSettings) {
    return { ...plugin.config.defaultSettings };
  }
  
  return undefined;
}

/**
 * Validate widget settings using plugin validator
 * 
 * @param registry - Plugin registry
 * @param widgetType - Widget type
 * @param settings - Settings to validate
 * @returns Validated settings or defaults if validation fails
 */
export function validateWidgetSettings(
  registry: { get: (id: string) => WidgetPlugin | undefined },
  widgetType: string,
  settings: unknown,
): Record<string, unknown> {
  const plugin = registry.get(widgetType);
  
  if (!plugin) {
    console.error(`[PluginAdapter] Cannot validate settings for unknown widget "${widgetType}"`);
    return {};
  }
  
  if (!plugin.settingsValidator) {
    // No validator - return settings as-is (or defaults)
    return (settings as Record<string, unknown>) || plugin.config.defaultSettings || {};
  }
  
  const result = plugin.settingsValidator.validate(settings);
  if (result.valid) {
    return result.settings;
  } else {
    console.warn(`[PluginAdapter] Settings validation failed for "${widgetType}": ${result.error}`);
    return plugin.settingsValidator.getDefaults();
  }
}
