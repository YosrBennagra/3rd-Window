import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface Monitor {
  name: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  is_primary: boolean;
}

export interface AppSettings {
  isFullscreen: boolean;
  selectedMonitor: number;
}

interface AppState {
  settingsOpen: boolean;
  settings: AppSettings;
  monitors: Monitor[];
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
    const newSettings = { ...previousSettings, isFullscreen: fullscreen };
    
    try {
      console.info('[settings] setFullscreen ->', fullscreen);
      
      // Apply fullscreen immediately
      await invoke('apply_fullscreen', { fullscreen });
      
      // Update state and save
      set({ settings: newSettings });
      await invoke('save_settings', { settings: newSettings });
      
      console.info('[settings] setFullscreen -> success');
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      // Revert on error
      set({ settings: previousSettings });
      try {
        await invoke('apply_fullscreen', { fullscreen: previousSettings.isFullscreen });
      } catch (revertError) {
        console.error('Failed to revert fullscreen:', revertError);
      }
    }
  },
  
  setSelectedMonitor: async (monitorIndex) => {
    const previousSettings = get().settings;
    const newSettings = { ...previousSettings, selectedMonitor: monitorIndex };
    const wasFullscreen = previousSettings.isFullscreen;
    
    try {
      console.info('[settings] setSelectedMonitor ->', monitorIndex, 'wasFullscreen:', wasFullscreen);
      
      // If currently in fullscreen, exit first to prevent broken layout
      if (wasFullscreen) {
        await invoke('apply_fullscreen', { fullscreen: false });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Move to new monitor
      await invoke('move_to_monitor', { monitorIndex });
      
      // Wait for window to settle after move
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-enter fullscreen if it was enabled - this adapts to new monitor size
      if (wasFullscreen) {
        await invoke('apply_fullscreen', { fullscreen: true });
      }
      
      // Update state and save
      set({ settings: newSettings });
      await invoke('save_settings', { settings: newSettings });
      
      console.info('[settings] setSelectedMonitor -> success');
    } catch (error) {
      console.error('Failed to change monitor:', error);
      set({ settings: previousSettings });
      // Try to restore fullscreen state on error
      if (wasFullscreen) {
        try {
          await invoke('apply_fullscreen', { fullscreen: true });
        } catch (restoreError) {
          console.error('Failed to restore fullscreen:', restoreError);
        }
      }
    }
  },
  
  loadSettings: async () => {
    try {
      const settings = await invoke<AppSettings>('load_settings');
      console.info('[settings] loadSettings ->', settings);
      
      set({ settings });
      
      // Move to saved monitor first
      await invoke('move_to_monitor', { monitorIndex: settings.selectedMonitor });
      
      // Wait for window to settle after move
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then apply fullscreen state if it was saved
      if (settings.isFullscreen) {
        await invoke('apply_fullscreen', { fullscreen: true });
      }
      
      console.info('[settings] loadSettings -> success');
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settings: defaultSettings });
    }
  },
  
  loadMonitors: async () => {
    try {
      const monitors = await invoke<Monitor[]>('get_monitors');
      set({ monitors });
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  },
}));
