import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useGridStore } from './store/gridStore';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { DraggableGrid } from './components/layout/DraggableGrid';
import WidgetPickerWindow from './WidgetPickerWindow';
import './App.css';

export default function App() {
  const { loadSettings, loadMonitors } = useStore();
  const { loadDashboard } = useGridStore();
  const [isWidgetPicker, setIsWidgetPicker] = useState(window.location.hash === '#/widget-picker');

  useEffect(() => {
    const handleHashChange = () => {
      setIsWidgetPicker(window.location.hash === '#/widget-picker');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load all persisted state on app startup ONLY ONCE
  useEffect(() => {
    if (isWidgetPicker) return; // Don't load heavy state for picker window

    const initializeApp = async () => {
      // Load in parallel for faster startup
      await Promise.all([
        loadSettings(),
        loadMonitors(),
        loadDashboard(),
      ]);
    };
    
    void initializeApp();
  }, [isWidgetPicker]);

  if (isWidgetPicker) {
    return <WidgetPickerWindow />;
  }

  return (
    <div className="app">
      <DraggableGrid />
      <SettingsPanel />
    </div>
  );
}
