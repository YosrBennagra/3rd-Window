import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import AddWidgetPanel from './components/panels/AddWidgetPanel';
import { widgetDefinitions } from './config/widgets';
import './App.css';

export default function WidgetPickerWindow() {
  const [searchTerm, setSearchTerm] = useState('');
  
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
    await emit('add-widget', { type });
    handleClose();
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
        onAdd={handleAdd} 
        widgets={filteredWidgets}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </div>
  );
}
