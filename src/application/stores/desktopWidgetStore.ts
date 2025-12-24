import { create } from 'zustand';
import { DesktopWidgetConfig } from '../../domain/models/desktop-widget';
import { spawnDesktopWidget, closeDesktopWidget, getDesktopWidgets } from '../../infrastructure/ipc/desktop-widgets';

/**
 * Desktop Widget Store (Zustand Architecture Best Practice)
 * 
 * This store manages desktop widget state ONLY.
 * Follows Zustand principles:
 * - One store per concern (desktop widgets)
 * - Delegates side effects to IPC abstraction layer
 * - Explicit state ownership
 * - Actions named by intent
 * - State is minimal and intentional
 * 
 * Note: This store delegates to IPC abstractions (infrastructure layer),
 * which is acceptable as it's not calling Tauri directly.
 */

interface DesktopWidgetState {
  desktopWidgets: DesktopWidgetConfig[];
  isLoaded: boolean;
  
  // Actions
  loadDesktopWidgets: () => Promise<void>;
  addDesktopWidget: (config: DesktopWidgetConfig) => Promise<void>;
  removeDesktopWidget: (widgetId: string) => Promise<void>;
  updateDesktopWidgetPosition: (widgetId: string, x: number, y: number) => void;
}

export const useDesktopWidgetStore = create<DesktopWidgetState>((set) => ({
  desktopWidgets: [],
  isLoaded: false,

  loadDesktopWidgets: async () => {
    try {
      const widgets = await getDesktopWidgets();
      set({ desktopWidgets: widgets, isLoaded: true });

      // Restore all desktop widgets on app startup
      for (const widget of widgets) {
        try {
          await spawnDesktopWidget(widget);
        } catch (error) {
          console.error(`Failed to restore desktop widget ${widget.widgetId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load desktop widgets:', error);
      set({ desktopWidgets: [], isLoaded: true });
    }
  },

  addDesktopWidget: async (config: DesktopWidgetConfig) => {
    try {
      await spawnDesktopWidget(config);
      set((state) => ({
        desktopWidgets: [...state.desktopWidgets, config],
      }));
    } catch (error) {
      console.error('Failed to add desktop widget:', error);
      throw error;
    }
  },

  removeDesktopWidget: async (widgetId: string) => {
    try {
      await closeDesktopWidget(widgetId);
      set((state) => ({
        desktopWidgets: state.desktopWidgets.filter((w) => w.widgetId !== widgetId),
      }));
    } catch (error) {
      console.error('Failed to remove desktop widget:', error);
      throw error;
    }
  },

  updateDesktopWidgetPosition: (widgetId: string, x: number, y: number) => {
    set((state) => ({
      desktopWidgets: state.desktopWidgets.map((w) =>
        w.widgetId === widgetId ? { ...w, x, y } : w
      ),
    }));
  },
}));
