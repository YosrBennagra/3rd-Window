import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SettingsPanel } from './components/settings/SettingsPanel';
import './App.css';

export default function SettingsWindow() {
  const handleClose = () => {
    console.info('[WidgetPicker] Closing window');
    getCurrentWindow().close();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="explorer-window">
      <div className="explorer-header" data-tauri-drag-region>
        <div className="explorer-header__left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 13a7.34 7.34 0 0 0 .1-2l2-1.5-2-3.5-2.4.5a7.27 7.27 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7.27 7.27 0 0 0-1.7 1l-2.4-.5-2 3.5 2 1.5a7.34 7.34 0 0 0 0 2l-2 1.5 2 3.5 2.4-.5a7.27 7.27 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.27 7.27 0 0 0 1.7-1l2.4.5 2-3.5z" />
          </svg>
          <span>Settings</span>
        </div>
        <button 
          type="button"
          className="explorer-header__close"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-tauri-drag-region="false"
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>
      <div className="settings-content">
        <SettingsPanel />
      </div>
    </div>
  );
}
