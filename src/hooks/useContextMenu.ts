import { useState, useEffect } from 'react';
import type { ContextMenuPosition } from '../types/widget';

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
}
