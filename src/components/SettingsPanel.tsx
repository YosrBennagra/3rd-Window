import { useState } from 'react';
import { useRefresh, usePowerSaving, useTheme } from '../state/selectors';
import { useAppStore } from '../state/store';
import AlertRulesManager from './AlertRulesManager';
import WidgetManager from './WidgetManager';
import AdvancedSettings from './AdvancedSettings';

type SettingsSection = 'general' | 'widgets' | 'alerts' | 'advanced';

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const refresh = useRefresh();
  const { enabled, toggle } = usePowerSaving();
  const theme = useTheme();
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <div className="settings-panel">
      {/* Sidebar Navigation */}
      <nav className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2>Settings</h2>
        </div>
        <div className="settings-nav">
          <button 
            className={`settings-nav-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >
            <span className="settings-nav-icon">⚙️</span>
            General
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveSection('widgets')}
          >
            <span className="settings-nav-icon">🎨</span>
            Widgets
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveSection('alerts')}
          >
            <span className="settings-nav-icon">🔔</span>
            Alert Rules
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveSection('advanced')}
          >
            <span className="settings-nav-icon">🔧</span>
            Advanced
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="settings-content">
        {activeSection === 'general' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2>General Settings</h2>
              <p className="muted">Configure general application behavior</p>
            </div>

            <div className="settings-group">
              <div>
                <p className="list-title">Power Saving Mode</p>
                <p className="muted tiny">Black background, keep key widgets lit</p>
              </div>
              <button className="btn ghost" onClick={toggle}>
                {enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="settings-group">
              <div>
                <p className="list-title">Theme</p>
                <p className="muted tiny">Choose your preferred color scheme</p>
              </div>
              <div className="pill-group">
                {(['light', 'dark', 'auto'] as const).map((t) => (
                  <button
                    key={t}
                    className={`pill ${theme === t ? 'pill--active' : 'pill--ghost'}`}
                    onClick={() => setTheme(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <div>
                <p className="list-title">Refresh Data</p>
                <p className="muted tiny">Pull latest metrics and notifications</p>
              </div>
              <button className="btn primary" onClick={refresh}>
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {activeSection === 'widgets' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2>Widget Management</h2>
              <p className="muted">Control widget visibility and scaling</p>
            </div>
            <WidgetManager />
          </div>
        )}

        {activeSection === 'alerts' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2>Alert Rules</h2>
              <p className="muted">Configure custom alert conditions</p>
            </div>
            <AlertRulesManager />
          </div>
        )}

        {activeSection === 'advanced' && (
          <div className="settings-section">
            <div className="settings-section-header">
              <h2>Advanced Settings</h2>
              <p className="muted">Monitor selection, window controls, and data management</p>
            </div>
            <AdvancedSettings />
          </div>
        )}
      </div>
    </div>
  );
}
