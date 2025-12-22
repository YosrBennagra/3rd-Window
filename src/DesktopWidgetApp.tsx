import { useEffect, useState } from 'react';
import { DesktopWidget } from './components/DesktopWidget';
import { ClockWidget, TemperatureWidget, RamUsageWidget, DiskUsageWidget, NetworkMonitorWidget } from './components/widgets';
import type { WidgetLayout } from './types/layout';
import './App.css';

interface DesktopWidgetViewProps {
  widgetId: string;
  widgetType: string;
}

export function DesktopWidgetView({ widgetId, widgetType }: DesktopWidgetViewProps) {
  // Create a mock widget layout for widgets that require it
  const mockWidget: WidgetLayout = {
    id: widgetId,
    widgetType: widgetType,
    x: 0,
    y: 0,
    width: 2,
    height: 2,
    settings: {},
  };

  const renderWidget = () => {
    switch (widgetType.toLowerCase()) {
      case 'clock':
        return <ClockWidget />;
      case 'temperature':
      case 'cpu-temp':
      case 'gpu-temp':
        return <TemperatureWidget widget={mockWidget} />;
      case 'ram':
      case 'ram-usage':
        return <RamUsageWidget widget={mockWidget} />;
      case 'disk':
      case 'disk-usage':
        return <DiskUsageWidget widget={mockWidget} />;
      case 'network-monitor':
      case 'network':
        return <NetworkMonitorWidget widget={mockWidget} />;
      default:
        return (
          <div style={{ padding: '20px', color: 'white' }}>
            <h3>Unknown Widget Type</h3>
            <p>Type: {widgetType}</p>
            <p>ID: {widgetId}</p>
          </div>
        );
    }
  };

  return (
    <DesktopWidget widgetId={widgetId} widgetType={widgetType}>
      {renderWidget()}
    </DesktopWidget>
  );
}

export default function DesktopWidgetApp() {
  const [widgetId, setWidgetId] = useState<string>('');
  const [widgetType, setWidgetType] = useState<string>('');

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const id = params.get('id') || 'unknown';
    const type = params.get('type') || 'unknown';
    
    setWidgetId(id);
    setWidgetType(type);
  }, []);

  if (!widgetId || !widgetType) {
    return (
      <div style={{ padding: '20px', color: 'white', background: 'rgba(26, 31, 46, 0.9)' }}>
        Loading widget...
      </div>
    );
  }

  return <DesktopWidgetView widgetId={widgetId} widgetType={widgetType} />;
}
