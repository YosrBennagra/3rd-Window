import { useEffect, useState, useRef } from 'react';
import { updateWidgetPosition } from '../../infrastructure/ipc/desktop-widgets';
import './DesktopWidget.css';

interface DesktopWidgetProps {
  widgetId: string;
  widgetType: string;
  children: React.ReactNode;
}

export function DesktopWidget({ widgetId, widgetType, children }: DesktopWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the title bar or specific drag handle
    const target = e.target as HTMLElement;
    if (!target.classList.contains('desktop-widget-drag-handle')) {
      return;
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - (widgetRef.current?.getBoundingClientRect().left || 0),
      y: e.clientY - (widgetRef.current?.getBoundingClientRect().top || 0),
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = async (e: MouseEvent) => {
      if (!widgetRef.current) return;

      const newX = e.screenX - dragOffset.x;
      const newY = e.screenY - dragOffset.y;

      try {
        await updateWidgetPosition(widgetId, newX, newY);
      } catch (error) {
        console.error('Failed to update widget position:', error);
      }
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
    <div
      ref={widgetRef}
      className={`desktop-widget ${isDragging ? 'dragging' : ''}`}
      data-widget-type={widgetType}
    >
      <div className="desktop-widget-drag-handle" onMouseDown={handleMouseDown}>
        <div className="drag-indicator">⋮⋮</div>
      </div>
      <div className="desktop-widget-content">
        {children}
      </div>
    </div>
  );
}
