import { useState } from 'react';
import { useRefresh, usePowerSaving, useTheme } from '../../application/selectors';
import { useAppStore } from '../../application/store';
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
      <nav className="settings-sidebar" aria-label="Settings navigation">
        <div className="settings-sidebar-header">
          <h2>Settings</h2>
        </div>
        <div className="settings-nav" role="tablist" aria-label="Settings sections">
          <button 
            className={`settings-nav-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
            role="tab"
            aria-selected={activeSection === 'general'}
            aria-controls="settings-section-content"
            id="tab-general"
          >
            <span className="settings-nav-icon" aria-hidden="true">⚙️</span>
            General
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveSection('widgets')}
            role="tab"
            aria-selected={activeSection === 'widgets'}
            aria-controls="settings-section-content"
            id="tab-widgets"
          >
            <span className="settings-nav-icon" aria-hidden="true">🎨</span>
            Widgets
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveSection('alerts')}
            role="tab"
            aria-selected={activeSection === 'alerts'}
            aria-controls="settings-section-content"
            id="tab-alerts"
          >
            <span className="settings-nav-icon" aria-hidden="true">🔔</span>
            Alert Rules
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveSection('advanced')}
            role="tab"
            aria-selected={activeSection === 'advanced'}
            aria-controls="settings-section-content"
            id="tab-advanced"
          >
            <span className="settings-nav-icon" aria-hidden="true">🔧</span>
            Advanced
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div 
        className="settings-content" 
        id="settings-section-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeSection}`}
      >
        {activeSection === 'general' && (
          <section className="settings-section" aria-labelledby="general-settings-title">
            <div className="settings-section-header">
              <h2 id="general-settings-title">General Settings</h2>
              <p className="muted">Configure general application behavior</p>
            </div>

            <div className="settings-group">
              <div>
                <p className="list-title" id="power-saving-label">Power Saving Mode</p>
                <p className="muted tiny">Black background, keep key widgets lit</p>
              </div>
              <button 
                className="btn ghost" 
                onClick={toggle}
                aria-label="Toggle power saving mode"
                aria-labelledby="power-saving-label"
                aria-pressed={enabled}
              >
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
                <p className="list-title" id="refresh-label">Refresh Data</p>
                <p className="muted tiny">Pull latest metrics and notifications</p>
              </div>
              <button 
                className="btn primary" 
                onClick={refresh}
                aria-label="Refresh data now"
                aria-labelledby="refresh-label"
              >
                Refresh Now
              </button>
            </div>
          </section>
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
