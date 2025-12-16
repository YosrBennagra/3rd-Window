import { useState, DragEvent } from 'react';
import { useGridStore, type WidgetGridItem } from '../../store/gridStore';
import { ClockWidget, CpuTempWidget, GpuTempWidget } from '../widgets';
import './DraggableGrid.css';

const GRID_COLS = 3;
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

  const handleDragStart = (e: DragEvent, widget: WidgetGridItem) => {
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
    <div className="draggable-grid">
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
          </div>
        );
      })}
    </div>
  );
}
