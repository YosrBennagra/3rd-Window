import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Monitor, AppSettings } from '../../domain/models/system';

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

const isTauriRuntime = (() => {
  let cached: boolean | null = null;
  return () => {
    if (cached !== null) return cached;
    if (typeof window === 'undefined') {
      cached = false;
      return cached;
    }
    const candidate = window as unknown as {
      __TAURI__?: { invoke?: unknown; core?: { invoke?: unknown } };
      __TAURI_IPC__?: unknown;
      __TAURI_INTERNALS__?: { invoke?: unknown; invokeHandler?: unknown };
    };
    cached =
      typeof candidate.__TAURI_IPC__ === 'function' ||
      typeof candidate.__TAURI__?.invoke === 'function' ||
      typeof candidate.__TAURI__?.core?.invoke === 'function' ||
      typeof candidate.__TAURI_INTERNALS__?.invoke === 'function' ||
      typeof candidate.__TAURI_INTERNALS__?.invokeHandler === 'function';
    return cached;
  };
})();

export const useStore = create<AppState>((set, get) => ({
  settingsOpen: false,
  settings: defaultSettings,
  monitors: [],
  
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  
  setFullscreen: async (fullscreen) => {
    const previousSettings = get().settings;
    const newSettings = { ...previousSettings, isFullscreen: fullscreen };
    
    try {
      console.info('[settings] setFullscreen ->', fullscreen, 'previous:', previousSettings.isFullscreen);
      
      // Apply fullscreen immediately
      if (isTauriRuntime()) {
        console.info('[settings] calling apply_fullscreen command');
        await invoke('apply_fullscreen', { fullscreen });
        console.info('[settings] apply_fullscreen command completed');
      } else {
        console.warn('[settings] Tauri runtime not available, skipping apply_fullscreen');
      }
      
      // Update state and save
      set({ settings: newSettings });
      console.info('[settings] state updated, new isFullscreen:', newSettings.isFullscreen);
      
      if (isTauriRuntime()) {
        await invoke('save_settings', { settings: newSettings });
        console.info('[settings] settings saved');
      }
      
      console.info('[settings] setFullscreen -> success');
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      // Revert on error
      set({ settings: previousSettings });
      if (isTauriRuntime()) {
        try {
          await invoke('apply_fullscreen', { fullscreen: previousSettings.isFullscreen });
        } catch (revertError) {
          console.error('Failed to revert fullscreen:', revertError);
        }
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
      if (wasFullscreen && isTauriRuntime()) {
        await invoke('apply_fullscreen', { fullscreen: false });
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Move to new monitor
      if (isTauriRuntime()) {
        await invoke('move_to_monitor', { monitorIndex });
      }
      
      // Wait for window to settle after move
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-enter fullscreen if it was enabled - this adapts to new monitor size
      if (wasFullscreen && isTauriRuntime()) {
        await invoke('apply_fullscreen', { fullscreen: true });
      }
      
      // Update state and save
      set({ settings: newSettings });
      if (isTauriRuntime()) {
        await invoke('save_settings', { settings: newSettings });
      }
      
      console.info('[settings] setSelectedMonitor -> success');
    } catch (error) {
      console.error('Failed to change monitor:', error);
      set({ settings: previousSettings });
      // Try to restore fullscreen state on error
      if (wasFullscreen && isTauriRuntime()) {
        try {
          await invoke('apply_fullscreen', { fullscreen: true });
        } catch (restoreError) {
          console.error('Failed to restore fullscreen:', restoreError);
        }
      }
    }
  },
  
  loadSettings: async () => {
    if (!isTauriRuntime()) {
      console.warn('[settings] loadSettings skipped - Tauri runtime unavailable');
      set({ settings: defaultSettings });
      return;
    }
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
    if (!isTauriRuntime()) {
      console.warn('[settings] loadMonitors skipped - Tauri runtime unavailable');
      return;
    }
    try {
      const monitors = await invoke<Monitor[]>('get_monitors');
      console.info('[settings] loadMonitors ->', monitors.length, 'monitors:', monitors);
      set({ monitors });
    } catch (error) {
      console.error('Failed to load monitors:', error);
      set({ monitors: [] });
    }
  },
}));
