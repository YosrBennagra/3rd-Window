import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import { IpcService } from '../services/ipc';
import AddWidgetPanel from './components/panels/AddWidgetPanel';
import { widgetDefinitions } from '../config/widgets';
import './App.css';

export default function WidgetPickerWindow() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  
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
    console.info('[WidgetPicker] Closing window');
    getCurrentWindow().close();
  };

  const handleAddToGrid = async (type: string) => {
    setIsSpawning(true);
    
    try {
      await emit('add-widget', { type });
      handleClose();
    } catch (error) {
      console.error('Failed to add widget to grid:', error);
    } finally {
      setIsSpawning(false);
    }
  };

  const handleAddToDesktop = async (type: string) => {
    setIsSpawning(true);
    
    try {
      const widgetId = `widget-${Date.now()}`;
      const widgetSizes: Record<string, { width: number; height: number }> = {
        clock: { width: 300, height: 150 },
        temperature: { width: 250, height: 180 },
        ram: { width: 280, height: 160 },
        disk: { width: 280, height: 160 },
        'network-monitor': { width: 320, height: 200 },
      };
      
      const size = widgetSizes[type] || { width: 250, height: 150 };
      
      await IpcService.widget.spawn({
        widgetId,
        widgetType: type,
        x: 100,
        y: 100,
        width: size.width,
        height: size.height,
        monitorIndex: undefined,
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to add widget to desktop:', error);
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
      <AddWidgetPanel 
        onClose={handleClose} 
        onAddToGrid={handleAddToGrid}
        onAddToDesktop={handleAddToDesktop}
        widgets={filteredWidgets}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isSpawning={isSpawning}
      />
    </div>
  );
}
