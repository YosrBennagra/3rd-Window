/**
 * Widget Plugin Adapters (Application Layer)
 * 
 * Utilities to convert existing widgets to the plugin system.
 * This allows gradual migration without breaking existing code.
 * 
 * Moved from domain to application layer to properly handle React types.
 * Domain layer must remain framework-agnostic.
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
  WidgetPluginLifecycle,
  WidgetPluginErrorHandler,
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
  defaultSize?: { width: number; height: number };
  resizable?: boolean;
  movable?: boolean;
  hasSettings?: boolean;
  defaultSettings?: Record<string, unknown>;
  settingsValidator?: WidgetPluginSettingsValidator;
  lifecycle?: WidgetPluginLifecycle;
  errorHandler?: WidgetPluginErrorHandler;
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
 * const clockPlugin = createWidgetPluginFromSimpleDescriptor({
 *   id: 'clock',
 *   name: 'Clock',
 *   description: 'Display current time',
 *   component: ClockWidget,
 *   constraints: { minWidth: 2, minHeight: 2, ... },
 * });
 * ```
 */
export function createWidgetPluginFromSimpleDescriptor(
  descriptor: SimpleWidgetDescriptor
): WidgetPlugin {
  const metadata: WidgetPluginMetadata = {
    id: descriptor.id,
    name: descriptor.name,
    version: '1.0.0',
    description: descriptor.description,
    author: 'ThirdScreen',
    apiVersion: '1.0.0',
    icon: descriptor.icon,
    tags: descriptor.tags || [],
  };

  const config: WidgetPluginConfig = {
    constraints: descriptor.constraints,
    defaultSize: descriptor.defaultSize || { 
      width: descriptor.constraints.minWidth, 
      height: descriptor.constraints.minHeight 
    },
    resizable: descriptor.resizable !== false,
    movable: descriptor.movable !== false,
    hasSettings: descriptor.hasSettings || false,
    defaultSettings: descriptor.defaultSettings || {},
  };

  return {
    metadata,
    config,
    component: descriptor.component as ComponentType<{ widget: WidgetLayout }>,
    lifecycle: descriptor.lifecycle,
    settingsValidator: descriptor.settingsValidator,
    errorHandler: descriptor.errorHandler,
  };
}

/**
 * Batch create plugins from multiple descriptors
 * 
 * @param descriptors - Array of widget descriptors
 * @returns Array of widget plugins
 */
export function createWidgetPluginsFromDescriptors(
  descriptors: SimpleWidgetDescriptor[]
): WidgetPlugin[] {
  return descriptors.map(createWidgetPluginFromSimpleDescriptor);
}

/**
 * Convert a legacy widget component to a plugin
 * 
 * This is the simplest adapter - just provide component and constraints.
 * 
 * @param id - Widget ID
 * @param name - Widget display name
 * @param component - React component
 * @param constraints - Size constraints
 * @returns Widget plugin
 */
export function adaptLegacyWidget(
  id: string,
  name: string,
  component: ComponentType<{ widget: WidgetLayout }>,
  constraints: WidgetConstraints
): WidgetPlugin {
  return createWidgetPluginFromSimpleDescriptor({
    id,
    name,
    description: name,
    component,
    constraints,
  });
}
