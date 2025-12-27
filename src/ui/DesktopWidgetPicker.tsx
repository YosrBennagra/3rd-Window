import { useState } from 'react';
import { IpcService } from '../application/services/ipc';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface WidgetOption {
  type: string;
  title: string;
  description: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
}

const WIDGET_OPTIONS: WidgetOption[] = [
  {
    type: 'clock',
    title: 'Clock',
    description: 'Display current time and date',
    icon: '🕐',
    defaultWidth: 300,
    defaultHeight: 150,
  },
  {
    type: 'temperature',
    title: 'Temperature',
    description: 'CPU and GPU temperature monitor',
    icon: '🌡️',
    defaultWidth: 250,
    defaultHeight: 180,
  },
  {
    type: 'ram',
    title: 'RAM Usage',
    description: 'Memory usage monitor',
    icon: '💾',
    defaultWidth: 280,
    defaultHeight: 160,
  },
  {
    type: 'disk',
    title: 'Disk Usage',
    description: 'Storage space monitor',
    icon: '💿',
    defaultWidth: 280,
    defaultHeight: 160,
  },
  {
    type: 'network-monitor',
    title: 'Network Monitor',
    description: 'Network speed and activity',
    icon: '🌐',
    defaultWidth: 320,
    defaultHeight: 200,
  },
];

export function DesktopWidgetPicker() {
  const [spawning, setSpawning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddWidget = async (widget: WidgetOption) => {
    setSpawning(true);
    setErrorMessage(null);
    
    try {
      const widgetId = `widget-${Date.now()}`;
      
      await IpcService.widget.spawn({
        widgetId,
        widgetType: widget.type,
        x: 100,
        y: 100,
        width: widget.defaultWidth,
        height: widget.defaultHeight,
        monitorIndex: undefined,
      });
      
      // Close picker after spawning
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Failed to spawn desktop widget:', error);
      setErrorMessage('Failed to add widget. Please try again.');
    } finally {
      setSpawning(false);
    }
  };

  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }} 
    role="main"
    aria-label="Desktop widget picker">
      <header>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: 600,
          color: '#e2e8f0',
        }}>
          Add Desktop Widget
        </h1>
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '13px',
          color: 'rgba(226, 232, 240, 0.6)',
        }}>
          Choose a widget to place on your desktop
        </p>
        {errorMessage && (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: 'rgba(248, 113, 113, 0.15)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#fca5a5',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {errorMessage}
          </div>
        )}
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        flex: 1,
        overflow: 'auto',
      }}
      role="list"
      aria-label="Available widgets">
        {WIDGET_OPTIONS.map((widget) => (
          <button
            key={widget.type}
            onClick={() => handleAddWidget(widget)}
            disabled={spawning}
            aria-label={`Add ${widget.title} widget: ${widget.description}`}
            aria-busy={spawning}
            role="listitem"
            style={{
              background: 'rgba(26, 31, 46, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              cursor: spawning ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              opacity: spawning ? 0.5 : 1,
              height: 'fit-content',
            }}
            onMouseEnter={(e) => {
              if (!spawning) {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(26, 31, 46, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '32px' }} aria-hidden="true">{widget.icon}</div>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#e2e8f0',
              textAlign: 'center',
            }}>
              {widget.title}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(226, 232, 240, 0.6)',
              textAlign: 'center',
              lineHeight: '1.4',
            }}>
              {widget.description}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
