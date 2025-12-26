/**
 * Widget Restoration Service (Separation of Concerns)
 * 
 * Handles restoration of desktop widgets on application startup.
 * Separated from store to follow single responsibility principle.
 * 
 * Following principles:
 * - Single Responsibility: Only handles widget restoration logic
 * - Separation from State: Store loads state, service restores widgets
 * - Error Resilience: Individual widget failures don't block others
 */

import { spawnDesktopWidget } from '../../infrastructure/ipc/desktop-widgets';
import type { DesktopWidgetConfig } from '../../domain/models/desktop-widget';

/**
 * Restore all desktop widgets from config
 * 
 * @param widgets - Array of widget configurations to restore
 * @returns Array of successfully restored widget IDs
 */
export async function restoreDesktopWidgets(
  widgets: DesktopWidgetConfig[]
): Promise<string[]> {
  const restored: string[] = [];
  const errors: Array<{ widgetId: string; error: unknown }> = [];

  for (const widget of widgets) {
    try {
      await spawnDesktopWidget(widget);
      restored.push(widget.widgetId);
    } catch (error) {
      console.error(`Failed to restore desktop widget ${widget.widgetId}:`, error);
      errors.push({ widgetId: widget.widgetId, error });
    }
  }

  // Log summary
  if (restored.length > 0) {
    console.info(`[WidgetRestoration] Restored ${restored.length} widget(s)`);
  }
  if (errors.length > 0) {
    console.warn(`[WidgetRestoration] Failed to restore ${errors.length} widget(s)`, errors);
  }

  return restored;
}

/**
 * Restore a single desktop widget
 * 
 * @param widget - Widget configuration to restore
 * @returns true if successful, false otherwise
 */
export async function restoreSingleWidget(widget: DesktopWidgetConfig): Promise<boolean> {
  try {
    await spawnDesktopWidget(widget);
    return true;
  } catch (error) {
    console.error(`Failed to restore widget ${widget.widgetId}:`, error);
    return false;
  }
}
