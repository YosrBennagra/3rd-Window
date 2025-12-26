import type { WidgetConstraints } from '../models/layout';

/**
 * Widget Size Constraints Configuration (SOLID: Single Responsibility)
 * 
 * This module is responsible ONLY for defining widget sizing rules.
 * Separated from state management to allow independent evolution.
 */

// Clock Widget
export const CLOCK_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 2,
  maxWidth: 3,
  maxHeight: 2,
};

// Timer Widget
export const TIMER_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 2,
  maxWidth: 3,
  maxHeight: 2,
};

// Activity Widget
export const ACTIVITY_CONSTRAINTS: WidgetConstraints = {
  minWidth: 6,
  minHeight: 4,
  maxWidth: 6,
  maxHeight: 4,
};

// Image Widget
export const IMAGE_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 12,
  maxHeight: 12,
};

// Video Widget
export const VIDEO_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 12,
  maxHeight: 12,
};

// Notes Widget
export const NOTES_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 8,
  maxHeight: 10,
};

// Quick Links Widget
export const QUICKLINKS_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 6,
  maxHeight: 8,
};

// Network Monitor Widget
export const NETWORK_MONITOR_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 4,
  maxWidth: 6,
  maxHeight: 8,
};

// Temperature Widget
export const TEMPERATURE_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 4,
  maxHeight: 6,
};

// RAM Usage Widget
export const RAM_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 4,
  maxHeight: 6,
};

// Disk Usage Widget
export const DISK_CONSTRAINTS: WidgetConstraints = {
  minWidth: 3,
  minHeight: 3,
  maxWidth: 4,
  maxHeight: 6,
};

// PDF Widget
export const PDF_CONSTRAINTS: WidgetConstraints = {
  minWidth: 4,
  minHeight: 4,
  maxWidth: 12,
  maxHeight: 12,
};

/**
 * Widget Constraints Registry
 * 
 * Centralized lookup for widget size constraints.
 * Open for extension: add new widget types without modifying existing entries.
 */
export const WIDGET_CONSTRAINTS: Record<string, WidgetConstraints> = {
  clock: CLOCK_CONSTRAINTS,
  timer: TIMER_CONSTRAINTS,
  activity: ACTIVITY_CONSTRAINTS,
  image: IMAGE_CONSTRAINTS,
  video: VIDEO_CONSTRAINTS,
  notes: NOTES_CONSTRAINTS,
  quicklinks: QUICKLINKS_CONSTRAINTS,
  'network-monitor': NETWORK_MONITOR_CONSTRAINTS,
  temperature: TEMPERATURE_CONSTRAINTS,
  ram: RAM_CONSTRAINTS,
  disk: DISK_CONSTRAINTS,
  pdf: PDF_CONSTRAINTS,
};

/**
 * Get constraints for a widget type with fallback defaults
 */
export function getWidgetConstraints(widgetType: string): WidgetConstraints {
  return WIDGET_CONSTRAINTS[widgetType] ?? {
    minWidth: 2,
    minHeight: 2,
    maxWidth: 12,
    maxHeight: 12,
  };
}
