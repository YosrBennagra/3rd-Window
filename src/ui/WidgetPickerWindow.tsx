import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import AddWidgetPanel from './components/panels/AddWidgetPanel';
import { widgetDefinitions } from '../config/widgets';
import './App.css';

type AddDestination = 'grid' | 'desktop';

export default function WidgetPickerWindow() {
  const [searchTerm, setSearchTerm] = useState('');
  const [destination, setDestination] = useState<AddDestination>('grid');
  const [isSpawning, setIsSpawning] = useState(false);
  
  // Check if opened from context menu (desktop mode)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'desktop') {
      setDestination('desktop');
    }
  }, []);
  
  const widgets = widgetDefinitions.map(def => ({
    id: def.id,
    name: def.title,
    description: def.description,
    isActive: false,
    disabled: def.disabled || false,
  }));

  const filteredWidgets = widgets.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClose = () => {
    getCurrentWindow().close();
  };

  const handleAdd = async (type: string) => {
    setIsSpawning(true);
    
    try {
      if (destination === 'desktop') {
        // Spawn directly to desktop
        const widgetId = `widget-${Date.now()}`;
        const widgetSizes: Record<string, { width: number; height: number }> = {
          clock: { width: 300, height: 150 },
          temperature: { width: 250, height: 180 },
          ram: { width: 280, height: 160 },
          disk: { width: 280, height: 160 },
          'network-monitor': { width: 320, height: 200 },
        };
        
        const size = widgetSizes[type] || { width: 250, height: 150 };
        
        await invoke('spawn_desktop_widget', {
          config: {
            widgetId,
            widgetType: type,
            x: 100,
            y: 100,
            width: size.width,
            height: size.height,
            monitorIndex: null,
          },
        });
      } else {
        // Add to grid (existing behavior)
        await emit('add-widget', { type });
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to add widget:', error);
      alert('Failed to add widget: ' + error);
    } finally {
      setIsSpawning(false);
    }
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
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          background: 'rgba(26, 31, 46, 0.8)',
          borderRadius: '8px',
          padding: '4px',
        }}>
          <button
            onClick={() => setDestination('grid')}
            disabled={isSpawning}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: destination === 'grid' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              border: destination === 'grid' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isSpawning ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
            }}
          >
            📊 Add to Dashboard
          </button>
          <button
            onClick={() => setDestination('desktop')}
            disabled={isSpawning}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: destination === 'desktop' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              border: destination === 'desktop' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isSpawning ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
            }}
          >
            🖥️ Add to Desktop
          </button>
        </div>
      </div>
      <AddWidgetPanel 
        onClose={handleClose} 
        onAdd={handleAdd} 
        widgets={filteredWidgets}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </div>
  );
}
