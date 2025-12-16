import { useEffect } from 'react';
import { useStore } from './store';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { DraggableGrid } from './components/layout/DraggableGrid';
import './App.css';

export default function App() {
  const { toggleSettings, loadSettings, loadMonitors } = useStore();

  // Load settings and monitors on app startup ONLY ONCE
  useEffect(() => {
    void loadSettings();
    void loadMonitors();
  }, []); // Empty dependency array = runs only on mount

  return (
    <div className="app">
      <DraggableGrid />

      {/* Floating settings button */}
      <button className="fab fab--settings" onClick={toggleSettings} title="Settings">
        ⚙️
      </button>

      <SettingsPanel />
    </div>
  );
}
