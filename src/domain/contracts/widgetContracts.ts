/**
 * Widget Contract Definitions
 * 
 * This file contains ALL widget contract definitions for ThirdScreen.
 * Every widget must have a contract defined here to be registered.
 */

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
} from '../../ui/components/widgets';
import { createWidgetContract } from '../adapters/widgetAdapter.tsx';
import { WidgetSizePresets } from '../contracts/WidgetContract';
import type { WidgetContract } from '../contracts/WidgetContract';

// ============================================================================
// UTILITY WIDGETS
// ============================================================================

export const ClockWidgetContract: WidgetContract = createWidgetContract({
  id: 'clock',
  displayName: 'Clock',
  description: 'Current time and date display with customizable formats',
  category: 'utility',
  icon: '🕐',
  supportedModes: ['both'],
  sizeConstraints: {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 4,
    maxHeight: 3,
    defaultWidth: 3,
    defaultHeight: 2,
    resizable: true,
  },
  component: ClockWidget,
  defaultSettings: {
    timeFormat: '12h',
    showSeconds: true,
    dateFormat: 'long',
    layoutStyle: 'stacked',
    alignment: 'center',
    fontSizeMode: 'auto',
    accentColor: '#ffffff',
    backgroundStyle: 'glass',
    effects: { glow: false, shadow: true },
    timezone: 'system',
    updateFrequency: 'second',
    clickBehavior: 'open-system-clock',
  },
  persistedFields: [
    'timeFormat',
    'showSeconds',
    'dateFormat',
    'layoutStyle',
    'alignment',
    'fontSizeMode',
    'accentColor',
    'backgroundStyle',
    'effects',
    'timezone',
    'updateFrequency',
    'clickBehavior',
  ],
  runtimeFields: [],
  onUnmount: async (context: import('../contracts/WidgetContract').WidgetLifecycleContext) => {
    // Clock uses useClock hook which handles its own cleanup
    console.log(`[Clock] Unmounting widget ${context.widgetId}`);
  },
});

export const TimerWidgetContract: WidgetContract = createWidgetContract({
  id: 'timer',
  displayName: 'Timer',
  description: 'Countdown timer with customizable duration',
  category: 'utility',
  icon: '⏱️',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.MEDIUM_FIXED,
  component: TimerWidget,
  defaultSettings: {
    duration: 300,
    autoStart: false,
    sound: true,
  },
  persistedFields: ['duration', 'autoStart', 'sound'],
  runtimeFields: ['currentTime', 'isRunning'],
});

export const NotesWidgetContract: WidgetContract = createWidgetContract({
  id: 'notes',
  displayName: 'Notes',
  description: 'Quick notes and todo lists',
  category: 'utility',
  icon: '📝',
  supportedModes: ['both'],
  sizeConstraints: {
    minWidth: 3,
    minHeight: 3,
    maxWidth: 8,
    maxHeight: 10,
    defaultWidth: 4,
    defaultHeight: 4,
    resizable: true,
  },
  component: NotesWidget,
  defaultSettings: {
    content: '',
    fontSize: 'medium',
  },
  persistedFields: ['content', 'fontSize'],
  runtimeFields: [],
  onUnmount: async (context: import('../contracts/WidgetContract').WidgetLifecycleContext) => {
    // Notes widget has localStorage cleanup
    console.log(`[Notes] Unmounting widget ${context.widgetId}`);
  },
});

export const QuickLinksWidgetContract: WidgetContract = createWidgetContract({
  id: 'quicklinks',
  displayName: 'Quick Links',
  description: 'Bookmarks and shortcuts',
  category: 'utility',
  icon: '🔗',
  supportedModes: ['both'],
  sizeConstraints: {
    minWidth: 3,
    minHeight: 3,
    maxWidth: 6,
    maxHeight: 8,
    defaultWidth: 4,
    defaultHeight: 4,
    resizable: true,
  },
  component: QuickLinksWidget,
  defaultSettings: {
    links: [],
  },
  persistedFields: ['links'],
  runtimeFields: [],
});

// ============================================================================
// SYSTEM MONITORING WIDGETS
// ============================================================================

export const TemperatureWidgetContract: WidgetContract = createWidgetContract({
  id: 'temperature',
  displayName: 'CPU/GPU Temperature',
  description: 'Monitor CPU and GPU temperatures',
  category: 'system',
  icon: '🌡️',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.COMPACT_MONITOR,
  component: TemperatureWidget,
  defaultSettings: {
    refreshInterval: 2000,
    showGraph: false,
  },
  persistedFields: ['refreshInterval', 'showGraph'],
  runtimeFields: ['cpuTemp', 'gpuTemp', 'cpuUsage'],
  capabilities: {
    requiresPermissions: ['system-info'],
  },
  onMount: async (context: import('../contracts/WidgetContract').WidgetLifecycleContext) => {
    console.log(`[Temperature] Mounted widget ${context.widgetId}`);
    // useSystemMetrics hook handles subscriptions
  },
  onUnmount: async (context: import('../contracts/WidgetContract').WidgetLifecycleContext) => {
    console.log(`[Temperature] Unmounting widget ${context.widgetId}`);
    // useSystemMetrics hook handles cleanup
  },
});

export const RamUsageWidgetContract: WidgetContract = createWidgetContract({
  id: 'ram',
  displayName: 'RAM Usage',
  description: 'Memory usage statistics',
  category: 'system',
  icon: '💾',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.COMPACT_MONITOR,
  component: RamUsageWidget,
  defaultSettings: {
    refreshInterval: 2000,
  },
  persistedFields: ['refreshInterval'],
  runtimeFields: ['used', 'total', 'percentage'],
  capabilities: {
    requiresPermissions: ['system-info'],
  },
});

export const DiskUsageWidgetContract: WidgetContract = createWidgetContract({
  id: 'disk',
  displayName: 'Disk Usage',
  description: 'Storage space monitoring',
  category: 'system',
  icon: '💿',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.COMPACT_MONITOR,
  component: DiskUsageWidget,
  defaultSettings: {
    refreshInterval: 5000,
    drive: 'C:',
  },
  persistedFields: ['refreshInterval', 'drive'],
  runtimeFields: ['used', 'total', 'percentage'],
  capabilities: {
    requiresPermissions: ['filesystem'],
  },
});

export const NetworkMonitorWidgetContract: WidgetContract = createWidgetContract({
  id: 'network-monitor',
  displayName: 'Network Monitor',
  description: 'Real-time network speed and data transfer statistics',
  category: 'system',
  icon: '📡',
  supportedModes: ['both'],
  sizeConstraints: {
    minWidth: 3,
    minHeight: 4,
    maxWidth: 6,
    maxHeight: 8,
    defaultWidth: 4,
    defaultHeight: 5,
    resizable: true,
  },
  component: NetworkMonitorWidget,
  defaultSettings: {
    refreshInterval: 1000,
    showGraph: true,
  },
  persistedFields: ['refreshInterval', 'showGraph'],
  runtimeFields: ['downloadSpeed', 'uploadSpeed', 'totalDownloaded', 'totalUploaded'],
  capabilities: {
    requiresNetwork: true,
    requiresPermissions: ['network-stats'],
  },
  onUnmount: async (context: import('../contracts/WidgetContract').WidgetLifecycleContext) => {
    console.log(`[NetworkMonitor] Unmounting widget ${context.widgetId}`);
    // Component handles interval cleanup
  },
});

export const ActivityWidgetContract: WidgetContract = createWidgetContract({
  id: 'activity',
  displayName: 'Activity Monitor',
  description: 'System uptime and active window tracking',
  category: 'system',
  icon: '📊',
  supportedModes: ['both'],
  sizeConstraints: {
    minWidth: 6,
    minHeight: 4,
    maxWidth: 6,
    maxHeight: 4,
    defaultWidth: 6,
    defaultHeight: 4,
    resizable: false,
    fixed: true,
  },
  component: ActivityWidget,
  defaultSettings: {
    refreshInterval: 3000,
  },
  persistedFields: ['refreshInterval'],
  runtimeFields: ['uptime', 'activeWindow'],
  capabilities: {
    requiresPermissions: ['window-tracking'],
  },
});

// ============================================================================
// MEDIA WIDGETS
// ============================================================================

export const ImageWidgetContract: WidgetContract = createWidgetContract({
  id: 'image',
  displayName: 'Picture',
  description: 'Display your favorite images',
  category: 'media',
  icon: '🖼️',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.LARGE_FLEXIBLE,
  component: ImageWidget,
  defaultSettings: {
    imageUrl: '',
    fit: 'contain',
  },
  persistedFields: ['imageUrl', 'fit'],
  runtimeFields: [],
});

export const VideoWidgetContract: WidgetContract = createWidgetContract({
  id: 'video',
  displayName: 'Video',
  description: 'Play your favorite videos',
  category: 'media',
  icon: '🎬',
  supportedModes: ['both'],
  sizeConstraints: WidgetSizePresets.LARGE_FLEXIBLE,
  component: VideoWidget,
  defaultSettings: {
    videoUrl: '',
    autoplay: false,
    loop: false,
    muted: true,
  },
  persistedFields: ['videoUrl', 'autoplay', 'loop', 'muted'],
  runtimeFields: ['playing', 'currentTime'],
});

export const PDFWidgetContract: WidgetContract = createWidgetContract({
  id: 'pdf',
  displayName: 'PDF Viewer',
  description: 'View PDF documents with zoom controls',
  category: 'media',
  icon: '📄',
  supportedModes: ['dashboard'],
  sizeConstraints: {
    minWidth: 4,
    minHeight: 4,
    maxWidth: 12,
    maxHeight: 12,
    defaultWidth: 6,
    defaultHeight: 6,
    resizable: true,
  },
  component: PDFWidget,
  defaultSettings: {
    pdfUrl: '',
    zoom: 100,
    page: 1,
  },
  persistedFields: ['pdfUrl', 'zoom', 'page'],
  runtimeFields: ['totalPages'],
});

// ============================================================================
// WIDGET CONTRACT REGISTRY
// ============================================================================

/**
 * All registered widget contracts
 * This is the single source of truth for available widgets
 */
export const WIDGET_CONTRACTS: Record<string, WidgetContract> = {
  // Utility
  clock: ClockWidgetContract,
  timer: TimerWidgetContract,
  notes: NotesWidgetContract,
  quicklinks: QuickLinksWidgetContract,
  
  // System Monitoring
  temperature: TemperatureWidgetContract,
  ram: RamUsageWidgetContract,
  disk: DiskUsageWidgetContract,
  'network-monitor': NetworkMonitorWidgetContract,
  activity: ActivityWidgetContract,
  
  // Media
  image: ImageWidgetContract,
  video: VideoWidgetContract,
  pdf: PDFWidgetContract,
};

/**
 * Get all widget contracts as array
 */
export function getAllWidgetContracts(): WidgetContract[] {
  return Object.values(WIDGET_CONTRACTS);
}

/**
 * Get widget contract by ID
 */
export function getWidgetContract(widgetId: string): WidgetContract | undefined {
  return WIDGET_CONTRACTS[widgetId];
}
