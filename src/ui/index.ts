/**
 * UI Layer Barrel Export
 * 
 * Central export point for the entire UI layer.
 * Provides clean imports for external modules.
 * 
 * @example
 * ```ts
 * // Instead of:
 * import { App } from './ui/App';
 * 
 * // Use:
 * import { App } from './ui';
 * ```
 */

// Main application components
export { App } from './App';
export { DesktopWidgetApp, DesktopWidgetView } from './DesktopWidgetApp';
export { DesktopWidgetPicker } from './DesktopWidgetPicker';
export { SettingsWindow } from './SettingsWindow';
export { WidgetPickerWindow } from './WidgetPickerWindow';

// Re-export all component categories
export * from './components';
