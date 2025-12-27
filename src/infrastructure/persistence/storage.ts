// Placeholder storage service - to be implemented

import type { AlertRule } from '../../domain/services/alerts';

interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Settings {
  theme: 'dark' | 'light' | 'auto';
  powerSaving: boolean;
  refreshInterval: number;
  powerSavingVisible?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  preferredMonitor?: number;
  windowPosition?: WindowPosition;
  widgetVisibility?: Record<string, boolean>;
  widgetScale?: Record<string, string>;
  widgetOrder?: string[];
  alertRules?: AlertRule[];
  notes?: string;
}

export const defaultSettings: Settings = {
  theme: 'dark',
  powerSaving: false,
  refreshInterval: 8000,
  powerSavingVisible: false,
  alwaysOnTop: false,
  fullscreen: false,
  preferredMonitor: 0,
  widgetVisibility: {},
  widgetScale: {},
  widgetOrder: [],
  alertRules: [],
  notes: '',
};

const STORAGE_KEY = 'thirdscreen.settings';

const normalizeSettings = (candidate: Partial<Settings> | null): Settings => {
  if (!candidate) return { ...defaultSettings };

  return {
    theme: candidate.theme === 'light' || candidate.theme === 'dark' || candidate.theme === 'auto'
      ? candidate.theme
      : defaultSettings.theme,
    powerSaving: typeof candidate.powerSaving === 'boolean' ? candidate.powerSaving : defaultSettings.powerSaving,
    refreshInterval: typeof candidate.refreshInterval === 'number'
      ? candidate.refreshInterval
      : defaultSettings.refreshInterval,
    powerSavingVisible: typeof candidate.powerSavingVisible === 'boolean'
      ? candidate.powerSavingVisible
      : defaultSettings.powerSavingVisible,
    alwaysOnTop: typeof candidate.alwaysOnTop === 'boolean' ? candidate.alwaysOnTop : defaultSettings.alwaysOnTop,
    fullscreen: typeof candidate.fullscreen === 'boolean' ? candidate.fullscreen : defaultSettings.fullscreen,
    preferredMonitor: typeof candidate.preferredMonitor === 'number'
      ? candidate.preferredMonitor
      : defaultSettings.preferredMonitor,
    windowPosition: candidate.windowPosition ?? defaultSettings.windowPosition,
    widgetVisibility: candidate.widgetVisibility ?? defaultSettings.widgetVisibility,
    widgetScale: candidate.widgetScale ?? defaultSettings.widgetScale,
    widgetOrder: candidate.widgetOrder ?? defaultSettings.widgetOrder,
    alertRules: candidate.alertRules ?? defaultSettings.alertRules,
    notes: candidate.notes ?? defaultSettings.notes,
  };
};

export async function loadSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    return { ...defaultSettings };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return normalizeSettings(parsed);
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}
