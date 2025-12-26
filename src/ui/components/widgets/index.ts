/**
 * Widget Components Barrel Export
 * 
 * This file re-exports widgets from their categorized folders:
 * - desktop/ - Standalone floating widgets for the desktop widget system
 * - panel/ - Panel widgets for the WidgetHost system
 * - shared/ - Shared components used by both systems
 */

// Desktop widgets (for widgetRegistry)
export * from './desktop';

// Panel widgets (for WidgetHost)
export * from './panel';

// Shared components
export * from './shared';
