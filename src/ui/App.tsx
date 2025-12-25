import { useEffect, useState } from 'react';
import { useStore } from '../application/stores/store';
import { useGridStore } from '../application/stores/gridStore';
import { DraggableGrid } from './components/layout/DraggableGrid';
import WidgetPickerWindow from './WidgetPickerWindow';
import SettingsWindow from './SettingsWindow';
import DesktopWidgetApp from './DesktopWidgetApp';
import DesktopWidgetPicker from './DesktopWidgetPicker';
import { initializeWidgetSystem } from '../domain/init/widgetSystem';
import { initMonitorEventHandling, stopMonitorEventHandling } from '../application/services/monitorEvents';
import './App.css';

/**
 * App Component (React 18 Best Practice + Widget Contract Design)
 * 
 * Follows React principles:
 * - Zustand selectors for minimal re-renders
 * - Single initialization effect with cleanup
 * - Route management via local state
 * - No business logic in JSX
 * 
 * Widget Contract Design:
 * - Initializes contract-based widget system on startup
 * - Widget registry and lifecycle manager are ready before rendering
 */

// Initialize widget system once (module-level)
let widgetSystemInitialized = false;

export default function App() {
  // React 18 Best Practice: Use Zustand selectors
  const loadSettings = useStore((state) => state.loadSettings);
  const loadMonitors = useStore((state) => state.loadMonitors);
  const loadDashboard = useGridStore((state) => state.loadDashboard);
  
  const [isWidgetPicker, setIsWidgetPicker] = useState(window.location.hash === '#/widget-picker');
  const [isDesktopWidget, setIsDesktopWidget] = useState(window.location.hash.startsWith('#/desktop-widget'));
  const [isDesktopWidgetPicker, setIsDesktopWidgetPicker] = useState(window.location.hash === '#/desktop-widget-picker');
  const [isSettingsWindow, setIsSettingsWindow] = useState(window.location.hash === '#/settings');

  useEffect(() => {
    const handleHashChange = () => {
      setIsWidgetPicker(window.location.hash === '#/widget-picker');
      setIsDesktopWidget(window.location.hash.startsWith('#/desktop-widget'));
      setIsDesktopWidgetPicker(window.location.hash === '#/desktop-widget-picker');
      setIsSettingsWindow(window.location.hash === '#/settings');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // React 18 Best Practice: Single initialization effect with proper cleanup
  useEffect(() => {
    if (isWidgetPicker || isDesktopWidget || isDesktopWidgetPicker || isSettingsWindow) return; // Don't load heavy state for special windows

    const initializeApp = async () => {
      // Widget Contract Design: Initialize widget system first
      if (!widgetSystemInitialized) {
        initializeWidgetSystem();
        widgetSystemInitialized = true;
      }

      // Load in parallel for faster startup
      await Promise.all([
        loadSettings(),
        loadMonitors(),
        loadDashboard(),
      ]);

      // Multi-Monitor UX: Initialize monitor hot-plug detection
      await initMonitorEventHandling();
    };
    
    void initializeApp();

    // Cleanup: Stop monitor event handling
    return () => {
      stopMonitorEventHandling();
    };
  }, [isWidgetPicker, isDesktopWidget, isDesktopWidgetPicker, isSettingsWindow, loadSettings, loadMonitors, loadDashboard]);

  if (isWidgetPicker) {
    return <WidgetPickerWindow />;
  }

  if (isDesktopWidget) {
    return <DesktopWidgetApp />;
  }

  if (isDesktopWidgetPicker) {
    return <DesktopWidgetPicker />;
  }

  if (isSettingsWindow) {
    return <SettingsWindow />;
  }

  return (
    <div className="app">
      <DraggableGrid />
    </div>
  );
}
