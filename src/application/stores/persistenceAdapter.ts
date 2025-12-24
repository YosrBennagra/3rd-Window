/**
 * Persistence Adapter
 * 
 * Bridges between Zustand stores and the persistence service.
 * This module handles the translation between store state and persisted state.
 * 
 * Architecture:
 * - Stores declare what they persist (explicit opt-in)
 * - Adapter translates between runtime state and persistence schema
 * - Persistence service handles actual I/O
 * 
 * Each store has its own section in PersistedState:
 * - useStore (app settings) → appSettings
 * - useGridStore (layout) → layout
 * - useAppStore (preferences) → preferences
 */

import type { PersistedState, WidgetLayout } from '../../types/persistence';
import type { WidgetLayout as DomainWidgetLayout } from '../../domain/models/layout';
import { loadPersistedState, savePersistedState } from '../../infrastructure/persistence/persistenceService';
import { CURRENT_SCHEMA_VERSION } from '../../types/persistence';

// ============================================================================
// HYDRATION (Load → Store)
// ============================================================================

/**
 * Hydrates app settings store from persisted state
 */
export function hydrateAppSettings(state: PersistedState) {
  return {
    isFullscreen: state.appSettings.isFullscreen,
    selectedMonitor: state.appSettings.selectedMonitor,
    alwaysOnTop: state.appSettings.alwaysOnTop,
  };
}

/**
 * Hydrates grid store from persisted state
 */
export function hydrateGridLayout(state: PersistedState) {
  return {
    grid: state.layout.grid,
    widgets: state.layout.widgets.map(translatePersistedWidget),
  };
}

/**
 * Hydrates app store preferences from persisted state
 */
export function hydratePreferences(state: PersistedState) {
  return {
    theme: state.preferences.theme,
    powerSaving: state.preferences.powerSaving,
    refreshInterval: state.preferences.refreshInterval,
    widgetVisibility: state.preferences.widgetVisibility,
    widgetScale: state.preferences.widgetScale,
    widgetOrder: state.preferences.widgetOrder,
    alertRules: state.preferences.alertRules,
    notes: state.preferences.notes,
  };
}

// ============================================================================
// DEHYDRATION (Store → Persist)
// ============================================================================

/**
 * Builds complete persisted state from store states
 * 
 * This is the single function that assembles all store state into
 * the versioned persistence format.
 */
export function buildPersistedState(stores: {
  appSettings: {
    isFullscreen: boolean;
    selectedMonitor: number;
    alwaysOnTop: boolean;
  };
  layout: {
    grid: { columns: number; rows: number };
    widgets: DomainWidgetLayout[];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    powerSaving: boolean;
    refreshInterval: number;
    widgetVisibility: Record<string, boolean>;
    widgetScale: Record<string, 'small' | 'medium' | 'large'>;
    widgetOrder: string[];
    alertRules: Array<{
      id: string;
      metric: string;
      operator: string;
      threshold: number;
      enabled: boolean;
    }>;
    notes: string;
  };
}): PersistedState {
  return {
    version: CURRENT_SCHEMA_VERSION,
    appSettings: {
      isFullscreen: stores.appSettings.isFullscreen,
      selectedMonitor: stores.appSettings.selectedMonitor,
      alwaysOnTop: stores.appSettings.alwaysOnTop,
      windowPosition: null, // TODO: Capture window position
    },
    layout: {
      grid: stores.layout.grid,
      widgets: stores.layout.widgets.map(translateDomainWidget),
    },
    preferences: {
      theme: stores.preferences.theme,
      powerSaving: stores.preferences.powerSaving,
      refreshInterval: stores.preferences.refreshInterval,
      widgetVisibility: stores.preferences.widgetVisibility,
      widgetScale: stores.preferences.widgetScale,
      widgetOrder: stores.preferences.widgetOrder,
      alertRules: stores.preferences.alertRules,
      notes: stores.preferences.notes,
    },
  };
}

// ============================================================================
// WIDGET TRANSLATION
// ============================================================================

/**
 * Translates persisted widget to domain widget layout
 */
function translatePersistedWidget(widget: WidgetLayout): DomainWidgetLayout {
  return {
    id: widget.id,
    widgetType: widget.widgetType,
    x: widget.x,
    y: widget.y,
    width: widget.width,
    height: widget.height,
    locked: widget.locked,
    settings: widget.settings,
  };
}

/**
 * Translates domain widget layout to persisted format
 */
function translateDomainWidget(widget: DomainWidgetLayout): WidgetLayout {
  return {
    id: widget.id,
    widgetType: widget.widgetType,
    x: widget.x,
    y: widget.y,
    width: widget.width,
    height: widget.height,
    locked: Boolean(widget.locked),
    settings: widget.settings,
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Loads and returns complete persisted state
 */
export async function loadState(): Promise<PersistedState> {
  return loadPersistedState();
}

/**
 * Saves complete persisted state (convenience wrapper)
 */
export async function saveState(state: PersistedState): Promise<void> {
  return savePersistedState(state);
}
