/**
 * UI Components Barrel Export
 * 
 * Central export point for all UI components organized by category.
 */

// Layout components
export { DraggableGrid } from './layout/DraggableGrid';
export { WidgetGrid } from './layout/WidgetGrid';
export { WidgetPalette } from './layout/WidgetPalette';
export { GridWidgetItem } from './layout/GridWidgetItem';
export { GridCells } from './layout/GridCells';
export { GridGhost } from './layout/GridGhost';

// Panel components
export { AddWidgetPanel } from './panels/AddWidgetPanel';

// Settings components
export { SettingsPanel, AdvancedSettings } from './settings';

// UI primitives
export { ContextMenu } from './ui/ContextMenu';
export { SplitView } from './ui/SplitView';
export { GridContextMenu } from './ui/GridContextMenu';

// Desktop widget components
export { DesktopWidget } from './DesktopWidget';

// Panel widget wrapper
export { WidgetFrame } from './WidgetFrame';
export { WidgetHost } from './WidgetHost';

// Widget exports (re-export from widgets barrel)
export * from './widgets';
