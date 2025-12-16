import { useState, useEffect } from 'react';
import { useStore } from './store';
import './App.css';

// Simple static widget component
function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget widget--medium">
      <div className="widget__header">
        <span className="widget__icon">🕐</span>
        <span className="widget__title">Clock</span>
      </div>
      <div className="widget__content">
        <div className="clock__time">
          {time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
        <div className="clock__date">
          {time.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
}

// Settings panel component
function SettingsPanel() {
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

// Main App component
export default function App() {
  const { toggleSettings, loadSettings, loadMonitors } = useStore();

  // Load settings and monitors on app startup ONLY ONCE
  useEffect(() => {
    void loadSettings();
    void loadMonitors();
  }, []); // Empty dependency array = runs only on mount

  return (
    <div className="app">
      <div className="app__container">
        <div className="widget-grid">
          <ClockWidget />
        </div>
      </div>

      {/* Floating settings button */}
      <button className="fab fab--settings" onClick={toggleSettings} title="Settings">
        ⚙️
      </button>

      <SettingsPanel />
    </div>
  );
}
