import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { WidgetLayout } from '../../types/layout';
import './GridContextMenu.css';

export type MenuAction = 
  | 'exit-fullscreen'
  | 'settings'
  | 'widget-settings'
  | 'remove-widget'
  | 'add-widget'
  | 'resize'
  | 'toggle-adjust-grid'
  | 'toggle-lock';

export interface ContextMenuState {
  x: number;
  y: number;
  widget: WidgetLayout | null; // null if right-clicked on empty grid area
}

interface Props {
  menu: ContextMenuState | null;
  onClose: () => void;
  onAction: (action: MenuAction, widget?: WidgetLayout | null) => void;
  widgetDisplayName?: (widgetType: string) => string;
  isAdjustGridMode?: boolean;
}

const defaultWidgetNames: Record<string, string> = {
  'clock': 'Clock',
  'cpu-temp': 'CPU Temperature',
  'gpu-temp': 'GPU Temperature',
  'notifications': 'Notifications',
  'chart': 'Chart',
};

export default function GridContextMenu({ menu, onClose, onAction, widgetDisplayName, isAdjustGridMode }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: -9999, top: -9999 });

  useEffect(() => {
    if (!menu) {
      setPosition({ left: -9999, top: -9999 });
    }
  }, [menu]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;

    const menuElement = menuRef.current;
    const { width, height } = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const SAFE_MARGIN = 10;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    let top = menu.y;
    let left = menu.x;

    const fitsBelow = menu.y + height + SAFE_MARGIN <= viewportHeight;
    const fitsAbove = menu.y - height - SAFE_MARGIN >= 0;
    const fitsRight = menu.x + width + SAFE_MARGIN <= viewportWidth;
    const fitsLeft = menu.x - width - SAFE_MARGIN >= 0;

    if (fitsBelow) {
      top = menu.y;
    } else if (fitsAbove) {
      top = menu.y - height;
    } else {
      top = menu.y - height / 2;
    }

    if (fitsRight) {
      left = menu.x;
    } else if (fitsLeft) {
      left = menu.x - width;
    } else {
      left = menu.x - width / 2;
    }

    const maxTop = Math.max(SAFE_MARGIN, viewportHeight - SAFE_MARGIN - height);
    const maxLeft = Math.max(SAFE_MARGIN, viewportWidth - SAFE_MARGIN - width);

    top = clamp(top, SAFE_MARGIN, maxTop);
    left = clamp(left, SAFE_MARGIN, maxLeft);

    setPosition((prev) => {
      if (prev.left === left && prev.top === top) return prev;
      return { left, top };
    });
  }, [menu]);

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

  const isWidgetLocked = menu.widget?.locked ?? false;

  const handleItemClick = (action: MenuAction) => {
    onAction(action, menu.widget);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="grid-context-menu"
      style={{ left: position.left, top: position.top }}
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
            className="grid-context-menu__item"
            onClick={() => handleItemClick('toggle-lock')}
          >
            <span className="grid-context-menu__icon">{isWidgetLocked ? '🔓' : '🔒'}</span>
            {isWidgetLocked ? 'Unlock Widget' : 'Lock Widget'}
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
        Show Grid Overlay
      </button>

      <button
        className="grid-context-menu__item"
        onClick={() => handleItemClick('settings')}
      >
        <span className="grid-context-menu__icon">⚙</span>
        Settings
      </button>
    </div>
  );
}
