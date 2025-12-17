import { useEffect } from 'react';
import { useStore } from './store';
import { useGridStore } from './store/gridStore';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { DraggableGrid } from './components/layout/DraggableGrid';
import './App.css';

export default function App() {
  const { loadSettings, loadMonitors } = useStore();
  const { loadDashboard } = useGridStore();

  // Load all persisted state on app startup ONLY ONCE
  useEffect(() => {
    const initializeApp = async () => {
      // Load in parallel for faster startup
      await Promise.all([
        loadSettings(),
        loadMonitors(),
        loadDashboard(),
      ]);
    };
    
    void initializeApp();
  }, []); // Empty dependency array = runs only on mount

  return (
    <div className="app">
      <DraggableGrid />
      <SettingsPanel />
    </div>
  );
}
