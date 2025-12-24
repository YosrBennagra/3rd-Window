import { create } from 'zustand';
import type { Monitor, AppSettings } from '../../domain/models/system';
import * as settingsService from '../services/settingsService';
import * as monitorService from '../services/monitorService';

/**
 * App Settings Store (Zustand Architecture Best Practice)
 * 
 * This store manages application settings state ONLY.
 * Follows Zustand principles:
 * - One store per concern (app settings and monitors)
 * - No side effects in store (delegated to services)
 * - Explicit state ownership
 * - Actions named by intent
 * - Persistent state separated from runtime state
 */

interface AppState {
  // Persistent state
  settings: AppSettings;
  
  // Runtime state
  settingsOpen: boolean;
  monitors: Monitor[];
  
  // Actions
  toggleSettings: () => void;
  setFullscreen: (fullscreen: boolean) => Promise<void>;
  setSelectedMonitor: (monitorIndex: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  loadMonitors: () => Promise<void>;
}

// Default settings
const defaultSettings: AppSettings = {
  isFullscreen: false,
  selectedMonitor: 0,
};

export const useStore = create<AppState>((set, get) => ({
  settingsOpen: false,
  settings: defaultSettings,
  monitors: [],
  
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  
  setFullscreen: async (fullscreen) => {
    const previousSettings = get().settings;
    
    try {
      console.info('[store] setFullscreen ->', fullscreen);
      
      // Delegate side effects to service
      const newSettings = await settingsService.setFullscreenWithPersistence(fullscreen, previousSettings);
      
      // Update state
      set({ settings: newSettings });
      console.info('[store] setFullscreen -> success');
    } catch (error) {
      console.error('[store] Failed to toggle fullscreen:', error);
      // Revert on error
      set({ settings: previousSettings });
      
      // Try to restore previous state
      try {
        await settingsService.applyFullscreen(previousSettings.isFullscreen);
      } catch (revertError) {
        console.error('[store] Failed to revert fullscreen:', revertError);
      }
    }
  },
  
  setSelectedMonitor: async (monitorIndex) => {
    const previousSettings = get().settings;
    
    try {
      console.info('[store] setSelectedMonitor ->', monitorIndex);
      
      // Delegate complex side effects to service
      const newSettings = await settingsService.changeMonitorWithFullscreen(monitorIndex, previousSettings);
      
      // Update state
      set({ settings: newSettings });
      console.info('[store] setSelectedMonitor -> success');
    } catch (error) {
      console.error('[store] Failed to change monitor:', error);
      set({ settings: previousSettings });
      
      // Try to restore fullscreen state on error
      if (previousSettings.isFullscreen) {
        try {
          await settingsService.applyFullscreen(true);
        } catch (restoreError) {
          console.error('[store] Failed to restore fullscreen:', restoreError);
        }
      }
    }
  },
  
  loadSettings: async () => {
    try {
      console.info('[store] loadSettings');
      
      // Delegate side effects to service
      const settings = await settingsService.initializeSettings();
      
      // Update state
      set({ settings });
      console.info('[store] loadSettings -> success');
    } catch (error) {
      console.error('[store] Failed to load settings:', error);
      set({ settings: defaultSettings });
    }
  },
  
  loadMonitors: async () => {
    try {
      console.info('[store] loadMonitors');
      
      // Delegate side effects to service
      const monitors = await monitorService.getMonitors();
      
      // Update state
      set({ monitors });
      console.info('[store] loadMonitors -> success');
    } catch (error) {
      console.error('[store] Failed to load monitors:', error);
      set({ monitors: [] });
    }
  },
  
  // Persistence methods (new versioned persistence)
  async savePersisted() {
    const { settings } = get();
    return settings;
  },
  
  async loadPersisted(persistedSettings: { isFullscreen: boolean; selectedMonitor: number }) {
    set({ 
      settings: persistedSettings
    });
  },
}));
