import { useEffect, useState, useRef } from 'react';
import { updateWidgetPosition } from '../../infrastructure/ipc/desktop-widgets';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WidgetContextMenu } from './WidgetContextMenu';
import './DesktopWidget.css';

interface DesktopWidgetProps {
  widgetId: string;
  widgetType: string;
  children: React.ReactNode;
}

export function DesktopWidget({ widgetId, widgetType, children }: DesktopWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = async (e: React.MouseEvent) => {
    // Don't start drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('.widget-control-btn')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Get current window position
    const window = getCurrentWindow();
    const position = await window.outerPosition();
    
    // Calculate offset between mouse and window top-left
    setDragOffset({
      x: e.screenX - position.x,
      y: e.screenY - position.y,
    });
    
    setIsDragging(true);
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke('close_desktop_widget', { widgetId });
    } catch (error) {
      console.error('Failed to close widget:', error);
    }
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke('minimize_desktop_widget', { widgetId });
    } catch (error) {
      console.error('Failed to minimize widget:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new window position: mouse position - drag offset
      const newX = e.screenX - dragOffset.x;
      const newY = e.screenY - dragOffset.y;

      // Update position (non-blocking)
      updateWidgetPosition(widgetId, newX, newY).catch((error) => {
        console.error('Failed to update widget position:', error);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, widgetId]);

  return (
    <>
      <div
        ref={widgetRef}
        className={`desktop-widget ${isDragging ? 'dragging' : ''}`}
        data-widget-type={widgetType}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onContextMenu={handleContextMenu}
      >
      <div 
        className={`desktop-widget-titlebar ${showControls ? 'visible' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="desktop-widget-title">
          <span className="drag-indicator">⋮⋮</span>
          <span className="widget-type-label">{widgetType}</span>
        </div>
        <div className="desktop-widget-controls">
          <button 
            className="widget-control-btn minimize-btn"
            onClick={handleMinimize}
            aria-label="Minimize widget"
            title="Minimize"
          >
            −
          </button>
          <button 
            className="widget-control-btn close-btn"
            onClick={handleClose}
            aria-label="Close widget"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="desktop-widget-content">
        {children}
      </div>
    </div>

    {contextMenu && (
      <WidgetContextMenu
        widgetId={widgetId}
        widgetType={widgetType}
        position={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    )}
  </>
  );
}
