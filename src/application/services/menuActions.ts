import type { WidgetLayout } from '../../domain/models/layout';

/**
 * Menu Action Handlers (SOLID: Open/Closed + Single Responsibility)
 * 
 * This module separates menu action handling from UI components.
 * Each action is a focused, testable function.
 * 
 * Benefits:
 * - Add new actions without modifying switch statements
 * - Test actions in isolation
 * - Clear separation of concerns
 */

export type MenuActionType =
  | 'exit-fullscreen'
  | 'settings'
  | 'widget-settings'
  | 'resize'
  | 'toggle-adjust-grid'
  | 'remove-widget'
  | 'add-widget'
  | 'toggle-lock'
  | 'pop-out-widget';

export interface MenuActionContext {
  widget?: WidgetLayout | null;
  selectedWidgetId?: string | null;
  settingsState?: { isFullscreen?: boolean };
  resizingWidgetId?: string | null;
  
  // Action handlers
  setFullscreen: (fullscreen: boolean) => Promise<void>;
  toggleSettings: () => void;
  setSelectedWidgetId: (id: string | null) => void;
  setActivePanel: (panel: 'widget-settings' | 'add-widget' | null) => void;
  beginResize: (widget: WidgetLayout) => void;
  toggleDebugGrid: () => void;
  removeWidget: (id: string) => Promise<boolean>;
  setWidgetLock: (id: string, locked: boolean) => Promise<boolean>;
  cancelResizeMode: () => void;
  openWidgetPicker: () => Promise<void>;
  handlePopOutWidget: (widget: WidgetLayout) => Promise<void>;
}

/**
 * Menu Action Handler Map
 * 
 * Replaces switch/case with extensible strategy pattern.
 * To add a new action: add handler to this map.
 */
export const menuActionHandlers: Record<
  MenuActionType,
  (context: MenuActionContext) => void | Promise<void>
> = {
  'exit-fullscreen': async (ctx) => {
    await ctx.setFullscreen(ctx.settingsState?.isFullscreen ? false : true);
  },

  'settings': (ctx) => {
    ctx.toggleSettings();
  },

  'widget-settings': (ctx) => {
    if (ctx.widget) {
      ctx.setSelectedWidgetId(ctx.widget.id);
      ctx.setActivePanel('widget-settings');
    }
  },

  'resize': (ctx) => {
    if (ctx.widget && !ctx.widget.locked) {
      ctx.beginResize(ctx.widget);
    }
  },

  'toggle-adjust-grid': (ctx) => {
    ctx.toggleDebugGrid();
  },

  'remove-widget': async (ctx) => {
    if (ctx.widget) {
      if (ctx.widget.id === ctx.selectedWidgetId) {
        ctx.setSelectedWidgetId(null);
        ctx.setActivePanel(null);
      }
      await ctx.removeWidget(ctx.widget.id);
    }
  },

  'add-widget': async (ctx) => {
    await ctx.openWidgetPicker();
  },

  'toggle-lock': async (ctx) => {
    if (ctx.widget) {
      if (ctx.resizingWidgetId === ctx.widget.id) {
        ctx.cancelResizeMode();
      }
      await ctx.setWidgetLock(ctx.widget.id, !(ctx.widget.locked ?? false));
    }
  },

  'pop-out-widget': async (ctx) => {
    if (ctx.widget) {
      await ctx.handlePopOutWidget(ctx.widget);
    }
  },
};

/**
 * Execute a menu action using the handler map
 * 
 * @param action - The action type to execute
 * @param context - The execution context with all dependencies
 */
export function executeMenuAction(
  action: MenuActionType,
  context: MenuActionContext,
): void | Promise<void> {
  const handler = menuActionHandlers[action];
  if (!handler) {
    console.warn(`[MenuActions] Unknown action: ${action}`);
    return;
  }
  return handler(context);
}
