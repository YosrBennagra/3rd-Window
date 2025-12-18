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
    setSelectedMonitor
  } = useStore();

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
              className="select-input"
              value={settings.selectedMonitor}
              onChange={(e) => { void setSelectedMonitor(Number(e.target.value)); }}
            >
              {monitors.map((monitor, index) => (
                <option key={index} value={index}>
                  {formatMonitorLabel(monitor, index)}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">Display Mode</label>
            <div className="btn-group">
              <button
                className={`btn ${!settings.isFullscreen ? 'btn--active' : ''}`}
                onClick={() => { void setFullscreen(false); }}
              >
                Windowed
              </button>
              <button
                className={`btn ${settings.isFullscreen ? 'btn--active' : ''}`}
                onClick={() => { void setFullscreen(true); }}
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
