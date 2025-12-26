/**
 * Desktop Widget Context Menu
 * 
 * Provides right-click context menu for desktop widgets following desktop UX principles:
 * - Quick access to common actions
 * - Always-on-top toggle
 * - Opacity control
 * - Close/minimize options
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IpcService } from '../../services/ipc';
import './WidgetContextMenu.css';

interface ContextMenuProps {
  widgetId: string;
  widgetType: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WidgetContextMenu({ widgetId, widgetType, position, onClose }: ContextMenuProps) {
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [opacity, setOpacity] = useState(1.0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to keep menu on screen
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust if menu would go off right edge
    if (x + rect.width > screenWidth) {
      x = screenWidth - rect.width - 10;
    }

    // Adjust if menu would go off bottom edge
    if (y + rect.height > screenHeight) {
      y = screenHeight - rect.height - 10;
    }

    // Keep menu at least 10px from edges
    x = Math.max(10, x);
    y = Math.max(10, y);

    setAdjustedPosition({ x, y });
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleToggleAlwaysOnTop = async () => {
    try {
      const newState = await invoke<boolean>('toggle_widget_always_on_top', { widgetId });
      setAlwaysOnTop(newState);
    } catch (error) {
      console.error('Failed to toggle always-on-top:', error);
    }
  };

  const handleOpacityChange = async (newOpacity: number) => {
    try {
      await IpcService.widget.setOpacity(widgetId, newOpacity);
      setOpacity(newOpacity);
    } catch (error) {
      console.error('Failed to set opacity:', error);
    }
  };

  const handleMinimize = async () => {
    try {
      await IpcService.widget.minimize(widgetId);
      onClose();
    } catch (error) {
      console.error('Failed to minimize widget:', error);
    }
  };

  const handleClose = async () => {
    try {
      await IpcService.widget.close({ widgetId });
      onClose();
    } catch (error) {
      console.error('Failed to close widget:', error);
    }
  };

  const menuContent = (
    <div
      ref={menuRef}
      className="widget-context-menu"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      role="menu"
      aria-label="Widget options"
    >
      <div className="context-menu-header">
        <span className="widget-type-badge">{widgetType}</span>
      </div>

      <div className="context-menu-section">
        <button
          className="context-menu-item"
          onClick={handleToggleAlwaysOnTop}
          role="menuitemcheckbox"
          aria-checked={alwaysOnTop}
        >
          <span className="menu-item-icon">{alwaysOnTop ? '📌' : '📍'}</span>
          <span>Always on Top</span>
          <span className="menu-item-indicator">{alwaysOnTop ? '✓' : ''}</span>
        </button>
      </div>

      <div className="context-menu-section">
        <div className="context-menu-label">Opacity</div>
        <div className="opacity-controls">
          {[1.0, 0.9, 0.8, 0.7, 0.6].map((value) => (
            <button
              key={value}
              className={`opacity-btn ${opacity === value ? 'active' : ''}`}
              onClick={() => handleOpacityChange(value)}
              aria-label={`Set opacity to ${value * 100}%`}
            >
              {Math.round(value * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className="context-menu-divider" />

      <div className="context-menu-section">
        <button
          className="context-menu-item"
          onClick={handleMinimize}
          role="menuitem"
        >
          <span className="menu-item-icon">−</span>
          <span>Minimize</span>
        </button>

        <button
          className="context-menu-item danger"
          onClick={handleClose}
          role="menuitem"
        >
          <span className="menu-item-icon">×</span>
          <span>Close Widget</span>
        </button>
      </div>
    </div>
  );

  // Render menu at document.body level to escape widget bounds
  return createPortal(menuContent, document.body);
}
