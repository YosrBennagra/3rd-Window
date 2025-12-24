import { create } from 'zustand';
import {
  AlertItem,
  IntegrationStatus,
  MetricSnapshot,
  NotificationItem,
  PipelineStatus,
  ShortcutItem
} from '../domain/models/widgets';
import { getSystemMetrics } from '../infrastructure/system/system-metrics';
import { getNotifications } from '../infrastructure/system/notifications';
import { evaluateAlerts } from '../infrastructure/system/alerts';
import { getShortcuts } from '../infrastructure/system/shortcuts';
import { getIntegrations } from '../infrastructure/system/integrations';
import { getPipelines } from '../infrastructure/system/pipelines';
import { loadSettings, saveSettings, defaultSettings } from '../infrastructure/persistence/storage';

export interface AlertRule {
  id: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

export interface AppState {
  theme: 'light' | 'dark' | 'auto';
  powerSaving: boolean;
  powerSavingVisible: string[];
  settingsOpen: boolean;
  alwaysOnTop: boolean;
  fullscreen: boolean;
  preferredMonitor: number | null;
  windowPosition: { x: number; y: number } | null;
  refreshInterval: number;
  widgetVisibility: Record<string, boolean>;
  widgetScale: Record<string, 'small' | 'medium' | 'large'>;
  widgetOrder: string[];
  alertRules: AlertRule[];
  metrics: MetricSnapshot | null;
  notifications: NotificationItem[];
  alerts: AlertItem[];
  shortcuts: ShortcutItem[];
  integrations: IntegrationStatus[];
  pipelines: PipelineStatus[];
  notes: string[];
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
  setTheme: (t: AppState['theme']) => void;
  togglePowerSaving: () => void;
  toggleSettings: () => void;
  closeSettings: () => void;
  toggleAlwaysOnTop: () => void;
  toggleFullscreen: () => void;
  setPreferredMonitor: (monitor: number) => void;
  saveWindowPosition: () => void;
  setRefreshInterval: (ms: number) => void;
  setPowerSavingVisible: (ids: string[]) => void;
  setNotes: (notes: string[]) => void;
  addWidget: (id: string) => void;
  toggleWidgetVisibility: (id: string) => void;
  setWidgetScale: (id: string, scale: 'small' | 'medium' | 'large') => void;
  setWidgetOrder: (order: string[]) => void;
  addAlertRule: (rule: AlertRule) => void;
  updateAlertRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteAlertRule: (id: string) => void;
  refreshAll: () => Promise<void>;
  initializeFromStorage: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'auto',
  powerSaving: false,
  powerSavingVisible: ['clock', 'alerts', 'network'],
  settingsOpen: false,
  alwaysOnTop: false,
  fullscreen: false,
  preferredMonitor: null,
  windowPosition: null,
  refreshInterval: 8000,
 widgetVisibility: defaultSettings.widgetVisibility || {},
 widgetScale: (defaultSettings.widgetScale as Record<string, 'small' | 'medium' | 'large'>) || {},
 widgetOrder: defaultSettings.widgetOrder || [],
 alertRules: defaultSettings.alertRules || [],
  metrics: null,
  notifications: [],
  alerts: [],
  shortcuts: [],
  integrations: [],
  pipelines: [],
  notes: [],
  lastUpdated: null,
  loading: false,
  error: null,
  setTheme: (theme) => {
    set({ theme });
    get().persistSettings();
  },
  togglePowerSaving: () => {
    set((s) => ({ powerSaving: !s.powerSaving }));
    get().persistSettings();
  },
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  closeSettings: () => set({ settingsOpen: false }),
  toggleAlwaysOnTop: async () => {
    const newValue = !get().alwaysOnTop;
    set({ alwaysOnTop: newValue });
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_always_on_top', { enabled: newValue });
      get().persistSettings();
    } catch (err) {
      console.error('Failed to set always-on-top:', err);
      set({ alwaysOnTop: !newValue });
    }
  },
  toggleFullscreen: async () => {
    const newValue = !get().fullscreen;
    set({ fullscreen: newValue });
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_fullscreen', { fullscreen: newValue });
      get().persistSettings();
    } catch (err) {
      console.error('Failed to toggle fullscreen:', err);
      set({ fullscreen: !newValue });
    }
  },
  setPreferredMonitor: (monitor) => {
    set({ preferredMonitor: monitor });
    get().persistSettings();
  },
  saveWindowPosition: async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      const position = await window.outerPosition();
      set({ windowPosition: { x: position.x, y: position.y } });
      get().persistSettings();
    } catch (err) {
      console.error('Failed to save window position:', err);
    }
  },
  setRefreshInterval: (ms) => {
    set({ refreshInterval: ms });
    get().persistSettings();
  },
  setPowerSavingVisible: (ids) => {
    set({ powerSavingVisible: ids });
    get().persistSettings();
  },
  setNotes: (notes) => {
    set({ notes });
    get().persistSettings();
  },
  addWidget: (id) => {
    set((s) => ({
      widgetVisibility: { ...s.widgetVisibility, [id]: true },
      widgetOrder: s.widgetOrder.includes(id) ? s.widgetOrder : [...s.widgetOrder, id]
    }));
    get().persistSettings();
  },
  toggleWidgetVisibility: (id) => {
    set((s) => ({
      widgetVisibility: { ...s.widgetVisibility, [id]: !s.widgetVisibility[id] }
    }));
    get().persistSettings();
  },
  setWidgetScale: (id, scale) => {
    set((s) => ({
      widgetScale: { ...s.widgetScale, [id]: scale }
    }));
    get().persistSettings();
  },
  setWidgetOrder: (order) => {
    set({ widgetOrder: order });
    get().persistSettings();
  },
  addAlertRule: (rule) => {
    set((s) => ({ alertRules: [...s.alertRules, rule] }));
    get().persistSettings();
  },
  updateAlertRule: (id, updates) => {
    set((s) => ({
      alertRules: s.alertRules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    }));
    get().persistSettings();
  },
  deleteAlertRule: (id) => {
    set((s) => ({ alertRules: s.alertRules.filter((r) => r.id !== id) }));
    get().persistSettings();
  },
  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      const [metrics, notifications, shortcuts, integrations, pipelines] = await Promise.all([
        getSystemMetrics(),
        getNotifications(),
        getShortcuts(),
        getIntegrations(),
        getPipelines()
      ]);

      const state = get();
      const alerts = evaluateAlerts(metrics, state.alertRules);

      set({
        metrics,
        notifications,
        alerts,
        shortcuts,
        integrations,
        pipelines,
        lastUpdated: Date.now(),
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Refresh failed', loading: false });
    }
  },
  initializeFromStorage: async () => {
    try {
      const settings = await loadSettings();
      set({
        theme: settings.theme,
        powerSaving: settings.powerSaving,
        powerSavingVisible: [],
        refreshInterval: settings.refreshInterval,
        alwaysOnTop: settings.alwaysOnTop || false,
        fullscreen: settings.fullscreen || false,
        preferredMonitor: settings.preferredMonitor || 0,
        windowPosition: settings.windowPosition || null,
        widgetVisibility: settings.widgetVisibility || {},
        widgetScale: (settings.widgetScale as Record<string, 'small' | 'medium' | 'large'>) || {},
        widgetOrder: settings.widgetOrder || [],
        alertRules: settings.alertRules || [],
        notes: []
      });

      // Apply window settings
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        if (settings.alwaysOnTop) {
          await invoke('set_always_on_top', { enabled: true });
        }
        if (settings.fullscreen) {
          await invoke('set_fullscreen', { fullscreen: true });
        }
        if (settings.windowPosition) {
          // TODO: Fix WindowPosition type to match Tauri Position interface
          // const { getCurrentWindow } = await import('@tauri-apps/api/window');
          // const window = getCurrentWindow();
          // await window.setPosition(settings.windowPosition);
        }
      } catch (err) {
        console.error('Failed to apply window settings:', err);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },
  persistSettings: async () => {
    const state = get();
    try {
      await saveSettings({
        theme: state.theme,
        powerSaving: state.powerSaving,
        powerSavingVisible: false,
        refreshInterval: state.refreshInterval,
        alwaysOnTop: state.alwaysOnTop,
        fullscreen: state.fullscreen,
        preferredMonitor: state.preferredMonitor || 0,
        windowPosition: state.windowPosition ? { x: state.windowPosition.x, y: state.windowPosition.y, width: 0, height: 0 } : undefined,
        widgetVisibility: state.widgetVisibility,
        widgetScale: state.widgetScale,
        widgetOrder: state.widgetOrder,
        alertRules: state.alertRules,
        notes: ''
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }
}));
