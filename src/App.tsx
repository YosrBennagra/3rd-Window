import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useGridStore } from './store/gridStore';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { DraggableGrid } from './components/layout/DraggableGrid';
import WidgetPickerWindow from './WidgetPickerWindow';
import DesktopWidgetApp from './DesktopWidgetApp';
import DesktopWidgetPicker from './DesktopWidgetPicker';
import './App.css';

export default function App() {
  const { loadSettings, loadMonitors } = useStore();
  const { loadDashboard } = useGridStore();
  const [isWidgetPicker, setIsWidgetPicker] = useState(window.location.hash === '#/widget-picker');
  const [isDesktopWidget, setIsDesktopWidget] = useState(window.location.hash.startsWith('#/desktop-widget'));
  const [isDesktopWidgetPicker, setIsDesktopWidgetPicker] = useState(window.location.hash === '#/desktop-widget-picker');

  useEffect(() => {
    const handleHashChange = () => {
      setIsWidgetPicker(window.location.hash === '#/widget-picker');
      setIsDesktopWidget(window.location.hash.startsWith('#/desktop-widget'));
      setIsDesktopWidgetPicker(window.location.hash === '#/desktop-widget-picker');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load all persisted state on app startup ONLY ONCE
  useEffect(() => {
    if (isWidgetPicker || isDesktopWidget || isDesktopWidgetPicker) return; // Don't load heavy state for special windows

    const initializeApp = async () => {
      // Load in parallel for faster startup
      await Promise.all([
        loadSettings(),
        loadMonitors(),
        loadDashboard(),
      ]);
    };
    
    void initializeApp();
  }, [isWidgetPicker, isDesktopWidget, isDesktopWidgetPicker]);

  if (isWidgetPicker) {
    return <WidgetPickerWindow />;
  }

  if (isDesktopWidget) {
    return <DesktopWidgetApp />;
  }

  if (isDesktopWidgetPicker) {
    return <DesktopWidgetPicker />;
  }

  return (
    <div className="app">
      <DraggableGrid />
      <SettingsPanel />
    </div>
  );
}
