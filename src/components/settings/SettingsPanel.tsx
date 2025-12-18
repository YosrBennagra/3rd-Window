import { useEffect } from 'react';
import { useStore } from '../../store';
import type { Monitor } from '../../types/system';

const RAW_MONITOR_ID_PATTERN = /^\\\\\.\\DISPLAY\\d+$/i;

const formatMonitorLabel = (monitor: Monitor, index: number) => {
  const fallbackName = `Monitor ${index + 1}`;
  const trimmedName = monitor.name?.trim();
  const baseName = trimmedName && !RAW_MONITOR_ID_PATTERN.test(trimmedName) ? trimmedName : fallbackName;
  const label = `${index + 1} - ${baseName}`;

  if (monitor.is_primary) {
    return `${label} (Primary)`;
  }

  return label;
};

export function SettingsPanel() {
  const { 
    settingsOpen, 
    toggleSettings, 
    settings,
    monitors,
    setFullscreen,
    setSelectedMonitor,
    loadMonitors,
  } = useStore();

  useEffect(() => {
    if (!settingsOpen) return;
    console.info('[settings] panel open -> monitors:', monitors.length, 'selected:', settings.selectedMonitor);
    // Always load monitors when panel opens to get latest monitor list
    void loadMonitors();
  }, [settingsOpen, loadMonitors, monitors.length, settings.selectedMonitor]);

  useEffect(() => {
    if (!settingsOpen) return;
    if (monitors.length === 0) return;
    if (settings.selectedMonitor >= 0 && settings.selectedMonitor < monitors.length) return;
    const fallbackIndex = monitors.findIndex((monitor) => monitor.is_primary);
    const nextIndex = fallbackIndex >= 0 ? fallbackIndex : 0;
    console.info('[settings] correcting monitor selection ->', nextIndex);
    void setSelectedMonitor(nextIndex);
  }, [settingsOpen, monitors, setSelectedMonitor, settings.selectedMonitor]);

  const resolvedMonitorIndex =
    monitors.length === 0
      ? -1
      : settings.selectedMonitor >= 0 && settings.selectedMonitor < monitors.length
        ? settings.selectedMonitor
        : (() => {
            const fallbackIndex = monitors.findIndex((monitor) => monitor.is_primary);
            return fallbackIndex >= 0 ? fallbackIndex : 0;
          })();

  const selectValue = resolvedMonitorIndex >= 0 ? resolvedMonitorIndex.toString() : '';

  if (!settingsOpen) return null;

  return (
    <div className="settings-overlay" onClick={toggleSettings}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings__header">
          <h2>Settings</h2>
          <button className="btn-close" onClick={toggleSettings}>✕</button>
        </div>
        
        <div className="settings__content">
          <div className="setting-group">
            <label className="setting-label">Monitor</label>
            <select 
              key={`monitor-select-${monitors.length}-${selectValue}`}
              className="select-input"
              value={selectValue}
              disabled={monitors.length === 0}
              onChange={(e) => {
                const nextIndex = Number(e.target.value);
                console.info('[settings] monitor selected:', nextIndex);
                if (!Number.isNaN(nextIndex)) {
                  void setSelectedMonitor(nextIndex);
                }
              }}
            >
              {monitors.length === 0 ? (
                <option value="">Loading monitors...</option>
              ) : (
                monitors.map((monitor, index) => (
                  <option key={index} value={index}>
                    {formatMonitorLabel(monitor, index)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">Display Mode</label>
            <div className="btn-group">
              <button
                className={`btn ${!settings.isFullscreen ? 'btn--active' : ''}`}
                onClick={() => { 
                  console.info('[settings] windowed mode clicked');
                  void setFullscreen(false); 
                }}
              >
                Windowed
              </button>
              <button
                className={`btn ${settings.isFullscreen ? 'btn--active' : ''}`}
                onClick={() => { 
                  console.info('[settings] fullscreen mode clicked');
                  void setFullscreen(true); 
                }}
              >
                Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
