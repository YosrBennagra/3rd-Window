import { useEffect, useState } from 'react';
import { DesktopWidget } from './components/DesktopWidget';
import { widgetRegistry } from '../config/widgetRegistry';
import type { WidgetLayout } from '../domain/models/layout';
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
    // Normalize widget type (handle aliases)
    const normalizedType = widgetType.toLowerCase();
    let lookupType = normalizedType;
    
    // Map aliases to canonical names
    if (normalizedType === 'cpu-temp' || normalizedType === 'gpu-temp') {
      lookupType = 'temperature';
    } else if (normalizedType === 'ram-usage') {
      lookupType = 'ram';
    } else if (normalizedType === 'disk-usage') {
      lookupType = 'disk';
    } else if (normalizedType === 'network') {
      lookupType = 'network-monitor';
    }
    
    const WidgetComponent = widgetRegistry.get(lookupType);
    
    if (WidgetComponent) {
      return <WidgetComponent widget={mockWidget} />;
    }
    
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h3>Unknown Widget Type</h3>
        <p>Type: {widgetType}</p>
        <p>ID: {widgetId}</p>
      </div>
    );
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
