import { useStore } from '../../store';

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
                  {monitor.name}
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
