import { useState, DragEvent } from 'react';
import { useGridStore, type WidgetGridItem } from '../../store/gridStore';
import { ClockWidget, CpuTempWidget, GpuTempWidget } from '../widgets';
import './DraggableGrid.css';

const GRID_COLS = 6;
const GRID_ROWS = 6;

const widgetComponents: Record<string, React.ComponentType> = {
  'clock': ClockWidget,
  'cpu-temp': CpuTempWidget,
  'gpu-temp': GpuTempWidget,
};

export function DraggableGrid() {
  const { widgets, updateWidgetPosition, removeWidget } = useGridStore();
  const [draggedWidget, setDraggedWidget] = useState<WidgetGridItem | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ width: number; height: number; x: number; y: number } | null>(null);

  const handleDragStart = (e: DragEvent, widget: WidgetGridItem) => {
    // Don't start drag if clicking on controls
    const target = e.target as HTMLElement;
    if (target.closest('.grid-widget__remove') || target.closest('.grid-widget__resize-handle')) {
      e.preventDefault();
      return;
    }
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setHoverCell(null);
  };

  const handleDragOver = (e: DragEvent, col: number, row: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverCell({ col, row });
  };

  const handleDrop = (e: DragEvent, col: number, row: number) => {
    e.preventDefault();
    
    if (!draggedWidget) return;

    const newPosition = {
      col,
      row,
      width: draggedWidget.position.width,
      height: draggedWidget.position.height,
    };

    // Check bounds
    if (col + newPosition.width > GRID_COLS || row + newPosition.height > GRID_ROWS) {
      return;
    }

    updateWidgetPosition(draggedWidget.id, newPosition);
    setDraggedWidget(null);
    setHoverCell(null);
  };

  const handleRemoveWidget = (id: string) => {
    removeWidget(id);
  };

  const handleWidgetDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResizeStart = (e: React.MouseEvent, widget: WidgetGridItem) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingWidget(widget.id);
    setResizeStart({
      width: widget.position.width,
      height: widget.position.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingWidget || !resizeStart) return;
    
    const widget = widgets.find(w => w.id === resizingWidget);
    if (!widget) return;

    const gridRect = e.currentTarget.getBoundingClientRect();
    const cellWidth = gridRect.width / GRID_COLS;
    const cellHeight = gridRect.height / GRID_ROWS;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const newWidth = Math.max(1, Math.min(
      Math.round(resizeStart.width + deltaX / cellWidth),
      GRID_COLS - widget.position.col
    ));
    const newHeight = Math.max(1, Math.min(
      Math.round(resizeStart.height + deltaY / cellHeight),
      GRID_ROWS - widget.position.row
    ));

    if (newWidth !== widget.position.width || newHeight !== widget.position.height) {
      updateWidgetPosition(widget.id, {
        ...widget.position,
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleResizeEnd = () => {
    setResizingWidget(null);
    setResizeStart(null);
  };

  const renderGridCells = () => {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const isHovered = hoverCell?.col === col && hoverCell?.row === row;
        cells.push(
          <div
            key={`${col}-${row}`}
            className={`grid-cell ${isHovered ? 'grid-cell--hover' : ''}`}
            onDragOver={(e) => handleDragOver(e, col, row)}
            onDrop={(e) => handleDrop(e, col, row)}
            style={{
              gridColumn: col + 1,
              gridRow: row + 1,
            }}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div 
      className="draggable-grid"
      onMouseMove={handleResizeMove}
      onMouseUp={handleResizeEnd}
      onMouseLeave={handleResizeEnd}
    >
      {renderGridCells()}
      
      {widgets.map((widget) => {
        const WidgetComponent = widgetComponents[widget.widgetType];
        if (!WidgetComponent) return null;

        return (
          <div
            key={widget.id}
            className={`grid-widget ${draggedWidget?.id === widget.id ? 'grid-widget--dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, widget)}
            onDragEnd={handleDragEnd}
            onDragOver={handleWidgetDragOver}
            style={{
              gridColumn: `${widget.position.col + 1} / span ${widget.position.width}`,
              gridRow: `${widget.position.row + 1} / span ${widget.position.height}`,
            }}
          >
            <div className="grid-widget__content">
              <WidgetComponent />
            </div>
            <button
              className="grid-widget__remove"
              onClick={() => handleRemoveWidget(widget.id)}
              title="Remove widget"
            >
              ✕
            </button>
            <div
              className="grid-widget__resize-handle"
              onMouseDown={(e) => handleResizeStart(e, widget)}
              title="Drag to resize"
            />
          </div>
        );
      })}
    </div>
  );
}
