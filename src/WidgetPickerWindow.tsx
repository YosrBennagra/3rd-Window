import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import AddWidgetPanel from './components/panels/AddWidgetPanel';
import './App.css';

export default function WidgetPickerWindow() {
  const widgets = [
    { id: 'clock', name: 'Clock', isActive: false },
    { id: 'timer', name: 'Timer', isActive: false },
  ];

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
      <AddWidgetPanel onClose={handleClose} onAdd={handleAdd} widgets={widgets} />
  );
}
