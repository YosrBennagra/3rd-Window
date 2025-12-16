import { useAppStore } from './store';

export const useTheme = () => useAppStore((s) => s.theme);
export const useMetrics = () => useAppStore((s) => s.metrics);
export const useNotifications = () => useAppStore((s) => s.notifications);
export const useAlerts = () => useAppStore((s) => s.alerts);
export const useShortcuts = () => useAppStore((s) => s.shortcuts);
export const useIntegrations = () => useAppStore((s) => s.integrations);
export const usePipelines = () => useAppStore((s) => s.pipelines);
export const useNotes = () => useAppStore((s) => s.notes);
export const usePowerSaving = () => useAppStore((s) => ({
	enabled: s.powerSaving,
	visible: s.powerSavingVisible,
	toggle: s.togglePowerSaving
}));
export const useSettingsVisibility = () => useAppStore((s) => ({
	open: s.settingsOpen,
	toggle: s.toggleSettings,
	close: s.closeSettings
}));
export const useRefresh = () => useAppStore((s) => s.refreshAll);
export const useLastUpdated = () => useAppStore((s) => s.lastUpdated);
