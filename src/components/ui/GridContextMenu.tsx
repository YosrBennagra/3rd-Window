import { useEffect, useRef } from 'react';
import type { WidgetGridItem } from '../../store/gridStore';
import './GridContextMenu.css';

export type MenuAction = 
  | 'exit-fullscreen'
  | 'settings'
  | 'widget-settings'
  | 'remove-widget'
  | 'add-widget'
  | 'resize'
  | 'toggle-adjust-grid';

export interface ContextMenuState {
  x: number;
  y: number;
  widget: WidgetGridItem | null; // null if right-clicked on empty grid area
}

interface Props {
  menu: ContextMenuState | null;
  onClose: () => void;
  onAction: (action: MenuAction, widget?: WidgetGridItem | null) => void;
  widgetDisplayName?: (widgetType: string) => string;
  isAdjustGridMode?: boolean;
}

const defaultWidgetNames: Record<string, string> = {
  'clock': 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
};

export default function GridContextMenu({ menu, onClose, onAction, widgetDisplayName, isAdjustGridMode }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay to avoid immediate close from the same click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const getWidgetName = (type: string) => {
    if (widgetDisplayName) return widgetDisplayName(type);
    return defaultWidgetNames[type] || type;
  };

  const handleItemClick = (action: MenuAction) => {
    onAction(action, menu.widget);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="grid-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Exit Fullscreen */}
      <button
        className="grid-context-menu__item"
        onClick={() => handleItemClick('exit-fullscreen')}
      >
        <span className="grid-context-menu__icon">⛶</span>
        Exit Fullscreen
      </button>

      <div className="grid-context-menu__divider" />

      {/* Widget-specific settings (only if clicked on a widget) */}
      {menu.widget && (
        <>
          <button
            className="grid-context-menu__item"
            onClick={() => handleItemClick('widget-settings')}
          >
            <span className="grid-context-menu__icon">⚙</span>
            {getWidgetName(menu.widget.widgetType)} Settings
          </button>

          <button
            className="grid-context-menu__item"
            onClick={() => handleItemClick('resize')}
          >
            <span className="grid-context-menu__icon">↔</span>
            Resize
          </button>

          <button
            className="grid-context-menu__item grid-context-menu__item--danger"
            onClick={() => handleItemClick('remove-widget')}
          >
            <span className="grid-context-menu__icon">✕</span>
            Remove Widget
          </button>

          <div className="grid-context-menu__divider" />
        </>
      )}

      {/* Add Widget */}
      <button
        className="grid-context-menu__item"
        onClick={() => handleItemClick('add-widget')}
      >
        <span className="grid-context-menu__icon">+</span>
        Add Widget
      </button>

      <div className="grid-context-menu__divider" />

      {/* General Settings */}
      <button
        className="grid-context-menu__item"
        onClick={() => handleItemClick('toggle-adjust-grid')}
      >
        <span className="grid-context-menu__icon">{isAdjustGridMode ? '✓' : '☐'}</span>
        Adjust Grid
      </button>

      <button
        className="grid-context-menu__item"
        onClick={() => handleItemClick('settings')}
      >
        <span className="grid-context-menu__icon">⚙</span>
        Dashboard Settings
      </button>
    </div>
  );
}
