/**
 * Widget Adapter System
 * 
 * Bridges existing widgets to the new contract-based system.
 * Provides helper functions to convert legacy widgets to contracts.
 */

import type { ComponentType } from 'react';
import type {
  WidgetContract,
  WidgetComponent,
  WidgetComponentProps,
  WidgetSizeConstraints,
  WidgetCategory,
  WidgetMode,
} from '../contracts/WidgetContract';
import type { WidgetLayout } from '../models/layout';

/**
 * Legacy widget component type (takes WidgetLayout)
 */
type LegacyWidgetComponent = ComponentType<{ widget: WidgetLayout }> | ComponentType<{ widget?: WidgetLayout }>;

/**
 * Adapter component that wraps legacy widgets
 * Converts new contract props to legacy props
 */
export function createWidgetAdapter(LegacyComponent: LegacyWidgetComponent): WidgetComponent {
  return function WidgetAdapter(props: WidgetComponentProps) {
    const { widgetId, size, settings } = props;

    // Convert new props to legacy WidgetLayout format
    const legacyWidget: WidgetLayout = {
      id: widgetId,
      widgetType: '', // Will be filled by registry
      x: 0, // Position not relevant for rendering
      y: 0,
      width: size.width,
      height: size.height,
      settings: settings,
    };

    // Pass legacy props to legacy component
    return <LegacyComponent widget={legacyWidget} />;
  };
}

/**
 * Helper to create a widget contract from legacy definitions
 */
export interface LegacyWidgetDefinition {
  id: string;
  title: string;
  component: string;
  defaultSize: { w: number; h: number };
  description: string;
  disabled?: boolean;
  category?: WidgetCategory;
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  resizable?: boolean;
  icon?: string;
}

/**
 * Convert legacy widget definition to contract
 */
export function legacyToContract(
  legacy: LegacyWidgetDefinition,
  component: LegacyWidgetComponent,
  options: {
    category?: WidgetCategory;
    supportedModes?: WidgetMode[];
    defaultSettings?: Record<string, unknown>;
    persistedFields?: string[];
    runtimeFields?: string[];
  } = {},
): WidgetContract {
  const {
    category = 'utility',
    supportedModes = ['dashboard', 'desktop'],
    defaultSettings = {},
    persistedFields = [],
    runtimeFields = [],
  } = options;

  // Build size constraints
  const sizeConstraints: WidgetSizeConstraints = {
    minWidth: legacy.minSize?.w ?? legacy.defaultSize.w,
    minHeight: legacy.minSize?.h ?? legacy.defaultSize.h,
    maxWidth: legacy.maxSize?.w ?? 12,
    maxHeight: legacy.maxSize?.h ?? 12,
    defaultWidth: legacy.defaultSize.w,
    defaultHeight: legacy.defaultSize.h,
    resizable: legacy.resizable ?? true,
    fixed: legacy.resizable === false,
  };

  // Create contract
  const contract: WidgetContract = {
    // Identity
    id: legacy.id,
    displayName: legacy.title,
    category,
    
    // Metadata
    description: legacy.description,
    supportedModes,
    version: '1.0.0',
    icon: legacy.icon,
    enabled: !legacy.disabled,
    
    // Sizing
    sizeConstraints,
    
    // Lifecycle (empty for now, widgets can override)
    lifecycle: {},
    
    // Persistence
    persistence: {
      persistedFields,
      runtimeFields,
      version: 1,
    },
    defaultSettings,
    
    // Component (wrap legacy component)
    component: createWidgetAdapter(component),
  };

  return contract;
}

/**
 * Helper to create contracts with proper settings
 */
export function createWidgetContract(
  config: {
    id: string;
    displayName: string;
    description: string;
    category: WidgetCategory;
    icon?: string;
    enabled?: boolean;
    supportedModes?: WidgetMode[];
    sizeConstraints: WidgetSizeConstraints;
    component: WidgetComponent | LegacyWidgetComponent;
    defaultSettings: Record<string, unknown>;
    persistedFields: string[];
    runtimeFields?: string[];
    version?: string;
    // Lifecycle hooks (optional)
    onInitialize?: NonNullable<WidgetContract['lifecycle']>['onInitialize'];
    onMount?: NonNullable<WidgetContract['lifecycle']>['onMount'];
    onResize?: NonNullable<WidgetContract['lifecycle']>['onResize'];
    onUnmount?: NonNullable<WidgetContract['lifecycle']>['onUnmount'];
    onSettingsChange?: NonNullable<WidgetContract['lifecycle']>['onSettingsChange'];
    onError?: NonNullable<WidgetContract['lifecycle']>['onError'];
    // Validation (optional)
    validateSettings?: WidgetContract['validateSettings'];
    // Capabilities (optional)
    capabilities?: WidgetContract['capabilities'];
  },
): WidgetContract {
  const {
    id,
    displayName,
    description,
    category,
    icon,
    enabled = true,
    supportedModes = ['both'],
    sizeConstraints,
    component,
    defaultSettings,
    persistedFields,
    runtimeFields = [],
    version = '1.0.0',
    onInitialize,
    onMount,
    onResize,
    onUnmount,
    onSettingsChange,
    onError,
    validateSettings,
    capabilities,
  } = config;

  // Detect if component is legacy (takes WidgetLayout)
  const isLegacy = component.length === 1; // Legacy components take single prop object
  const contractComponent = isLegacy
    ? createWidgetAdapter(component as LegacyWidgetComponent)
    : (component as WidgetComponent);

  return {
    id,
    displayName,
    category,
    description,
    supportedModes,
    version,
    icon,
    enabled,
    sizeConstraints,
    lifecycle: {
      onInitialize,
      onMount,
      onResize,
      onUnmount,
      onSettingsChange,
      onError,
    },
    persistence: {
      persistedFields,
      runtimeFields,
      version: 1,
    },
    defaultSettings,
    component: contractComponent,
    validateSettings,
    capabilities,
  };
}

/**
 * Batch convert legacy definitions to contracts
 */
export function convertLegacyWidgets(
  legacyDefinitions: LegacyWidgetDefinition[],
  componentMap: Record<string, LegacyWidgetComponent>,
  optionsMap?: Record<string, Parameters<typeof legacyToContract>[2]>,
): WidgetContract[] {
  return legacyDefinitions
    .filter((def) => componentMap[def.component]) // Only convert if component exists
    .map((def) => {
      const component = componentMap[def.component];
      const options = optionsMap?.[def.id] ?? {};
      return legacyToContract(def, component, options);
    });
}
