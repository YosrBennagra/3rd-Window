/**
 * Widget Plugin Bootstrap (Migration from Legacy to Plugin System)
 * 
 * This file registers all existing widgets with the plugin system.
 * This allows gradual migration: widgets work immediately through plugins,
 * but can be enhanced with plugin features over time.
 * 
 * Design Principles:
 * - Zero Breaking Changes: All existing widgets work immediately
 * - Gradual Enhancement: Add plugin features incrementally
 * - Backward Compatibility: Old code paths still work
 * - Central Registration: One place to see all available widgets
 */

import { widgetPluginRegistry } from '../domain/services/widgetPluginRegistry';
import { 
  createWidgetPluginFromSimpleDescriptor,
  createSettingsValidator,
} from '../application/services/widgetPluginAdapter';

// Import all existing widget components
import {
  ClockWidget,
  TimerWidget,
  ActivityWidget,
  ImageWidget,
  VideoWidget,
  NotesWidget,
  QuickLinksWidget,
  NetworkMonitorWidget,
  TemperatureWidget,
  RamUsageWidget,
  DiskUsageWidget,
  PDFWidget,
} from '../ui/components/widgets';

// Import widget constraints
import {
  CLOCK_CONSTRAINTS,
  TIMER_CONSTRAINTS,
  ACTIVITY_CONSTRAINTS,
  IMAGE_CONSTRAINTS,
  VIDEO_CONSTRAINTS,
  NOTES_CONSTRAINTS,
  QUICKLINKS_CONSTRAINTS,
  NETWORK_MONITOR_CONSTRAINTS,
  TEMPERATURE_CONSTRAINTS,
  RAM_CONSTRAINTS,
  DISK_CONSTRAINTS,
  PDF_CONSTRAINTS,
} from '../domain/config/widgetConstraints';

// Import widget settings
import {
  CLOCK_WIDGET_DEFAULT_SETTINGS,
  ensureClockWidgetSettings,
  TIMER_WIDGET_DEFAULT_SETTINGS,
  ensureTimerWidgetSettings,
  IMAGE_WIDGET_DEFAULT_SETTINGS,
  ensureImageWidgetSettings,
  VIDEO_WIDGET_DEFAULT_SETTINGS,
  ensureVideoWidgetSettings,
  NOTES_WIDGET_DEFAULT_SETTINGS,
  ensureNotesWidgetSettings,
  QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
  ensureQuickLinksWidgetSettings,
  NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS,
  ensureNetworkMonitorWidgetSettings,
  PDF_WIDGET_DEFAULT_SETTINGS,
  ensurePDFWidgetSettings,
} from '../domain/models/widgets';

/**
 * Register all core widgets as plugins
 * 
 * This function should be called once during app initialization.
 * It registers all existing widgets with the plugin system.
 */
export function registerCoreWidgets(): void {
  console.log('[WidgetBootstrap] Registering core widgets...');
  
  try {
    // Clock Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'clock',
        name: 'Clock',
        description: 'Display current time and date',
        component: ClockWidget,
        constraints: CLOCK_CONSTRAINTS,
        defaultSettings: CLOCK_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureClockWidgetSettings),
        tags: ['time', 'utility'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="20"/>
          <path d="M24 8v16l10 6"/>
        </svg>`,
      }),
    );
    
    // Timer Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'timer',
        name: 'Timer',
        description: 'Countdown timer with controls',
        component: TimerWidget,
        constraints: TIMER_CONSTRAINTS,
        defaultSettings: TIMER_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureTimerWidgetSettings),
        tags: ['time', 'utility', 'productivity'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 4h12"/>
          <circle cx="24" cy="26" r="18"/>
          <path d="M24 14v12l8 4"/>
        </svg>`,
      }),
    );
    
    // Activity Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'activity',
        name: 'Activity Monitor',
        description: 'System activity and performance metrics',
        component: ActivityWidget,
        constraints: ACTIVITY_CONSTRAINTS,
        tags: ['system', 'monitoring', 'performance'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 24h8l4-12 8 24 4-8h16"/>
        </svg>`,
      }),
    );
    
    // Image Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'image',
        name: 'Image',
        description: 'Display images with zoom and pan',
        component: ImageWidget,
        constraints: IMAGE_CONSTRAINTS,
        defaultSettings: IMAGE_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureImageWidgetSettings),
        tags: ['media', 'content'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="6" width="36" height="36" rx="2"/>
          <circle cx="17" cy="17" r="4"/>
          <path d="M6 34l12-12 8 8 12-12 4 4v8H6z"/>
        </svg>`,
      }),
    );
    
    // Video Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'video',
        name: 'Video',
        description: 'Video player with controls',
        component: VideoWidget,
        constraints: VIDEO_CONSTRAINTS,
        defaultSettings: VIDEO_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureVideoWidgetSettings),
        tags: ['media', 'content'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="10" width="36" height="28" rx="2"/>
          <path d="M20 18l12 8-12 8z"/>
        </svg>`,
      }),
    );
    
    // Notes Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'notes',
        name: 'Notes',
        description: 'Quick notes and todos',
        component: NotesWidget,
        constraints: NOTES_CONSTRAINTS,
        defaultSettings: NOTES_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureNotesWidgetSettings),
        tags: ['productivity', 'content'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="6" width="32" height="36" rx="2"/>
          <path d="M14 14h20M14 22h20M14 30h12"/>
        </svg>`,
      }),
    );
    
    // Quick Links Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'quicklinks',
        name: 'Quick Links',
        description: 'Favorite bookmarks and shortcuts',
        component: QuickLinksWidget,
        constraints: QUICKLINKS_CONSTRAINTS,
        defaultSettings: QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureQuickLinksWidgetSettings),
        tags: ['productivity', 'navigation'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 24h28M24 10v28"/>
          <rect x="14" y="14" width="8" height="8" rx="1"/>
          <rect x="26" y="14" width="8" height="8" rx="1"/>
          <rect x="14" y="26" width="8" height="8" rx="1"/>
          <rect x="26" y="26" width="8" height="8" rx="1"/>
        </svg>`,
      }),
    );
    
    // Network Monitor Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'network-monitor',
        name: 'Network Monitor',
        description: 'Real-time network speed and statistics',
        component: NetworkMonitorWidget,
        constraints: NETWORK_MONITOR_CONSTRAINTS,
        defaultSettings: NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensureNetworkMonitorWidgetSettings),
        tags: ['system', 'monitoring', 'network'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M24 8v8M24 32v8M8 24h8M32 24h8"/>
          <circle cx="24" cy="24" r="4"/>
          <circle cx="8" cy="8" r="2"/>
          <circle cx="40" cy="8" r="2"/>
          <circle cx="8" cy="40" r="2"/>
          <circle cx="40" cy="40" r="2"/>
        </svg>`,
      }),
    );
    
    // Temperature Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'temperature',
        name: 'Temperature Monitor',
        description: 'CPU and GPU temperature monitoring',
        component: TemperatureWidget,
        constraints: TEMPERATURE_CONSTRAINTS,
        tags: ['system', 'monitoring', 'hardware'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12v16M28 12v16M20 28a4 4 0 0 0 8 0"/>
          <rect x="18" y="4" width="12" height="32" rx="6"/>
        </svg>`,
      }),
    );
    
    // RAM Usage Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'ram',
        name: 'RAM Usage',
        description: 'Memory usage statistics',
        component: RamUsageWidget,
        constraints: RAM_CONSTRAINTS,
        tags: ['system', 'monitoring', 'memory'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="16" width="36" height="16" rx="2"/>
          <path d="M10 16v-4M18 16v-4M26 16v-4M34 16v-4M38 16v-4"/>
          <path d="M10 32v4M18 32v4M26 32v4M34 32v4M38 32v4"/>
        </svg>`,
      }),
    );
    
    // Disk Usage Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'disk',
        name: 'Disk Usage',
        description: 'Storage space monitoring',
        component: DiskUsageWidget,
        constraints: DISK_CONSTRAINTS,
        tags: ['system', 'monitoring', 'storage'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="18"/>
          <circle cx="24" cy="24" r="4"/>
          <path d="M24 6v12M24 30v12"/>
        </svg>`,
      }),
    );
    
    // PDF Widget
    widgetPluginRegistry.register(
      createWidgetPluginFromSimpleDescriptor({
        id: 'pdf',
        name: 'PDF Viewer',
        description: 'View PDF documents',
        component: PDFWidget,
        constraints: PDF_CONSTRAINTS,
        defaultSettings: PDF_WIDGET_DEFAULT_SETTINGS,
        settingsValidator: createSettingsValidator(ensurePDFWidgetSettings),
        tags: ['content', 'documents'],
        icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M28 6H12a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V16l-10-10z"/>
          <path d="M28 6v10h10"/>
          <text x="14" y="30" fontSize="10" fill="currentColor" fontFamily="Arial">PDF</text>
        </svg>`,
      }),
    );
    
    const registeredCount = widgetPluginRegistry.getEnabledIds().length;
    console.log(`[WidgetBootstrap] Successfully registered ${registeredCount} core widgets`);
    
  } catch (error) {
    console.error('[WidgetBootstrap] Failed to register core widgets:', error);
    throw error;
  }
}

/**
 * Get list of all registered widget metadata
 * Useful for widget picker UI
 */
export function getCoreWidgetsList() {
  return widgetPluginRegistry.getAllMetadata();
}

/**
 * Check if a widget type is registered
 */
export function isWidgetRegistered(widgetType: string): boolean {
  return widgetPluginRegistry.has(widgetType);
}

/**
 * Get widget plugin by type
 */
export function getWidgetPlugin(widgetType: string) {
  return widgetPluginRegistry.get(widgetType);
}
