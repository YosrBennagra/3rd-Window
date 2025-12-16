import { useEffect, useRef, useState } from 'react';
import { useGridStore, type WidgetGridItem, GRID_COLS, GRID_ROWS } from '../../store/gridStore';
import { ClockWidget, CpuTempWidget, GpuTempWidget } from '../widgets';
import './DraggableGrid.css';

const widgetComponents: Record<string, React.ComponentType> = {
  'clock': ClockWidget,
  'cpu-temp': CpuTempWidget,
  'gpu-temp': GpuTempWidget,
};

type DragInfo = { id: string; width: number; height: number };
type ResizeInfo = { id: string; startWidth: number; startHeight: number; startX: number; startY: number };

export function DraggableGrid() {
  const { widgets, updateWidgetPositionWithPush, removeWidget } = useGridStore();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const lastDragCellRef = useRef<{ col: number; row: number } | null>(null);

  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);
  const [isDragBlocked, setIsDragBlocked] = useState(false);

  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null);
  const [resizePointerId, setResizePointerId] = useState<number | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const getGridMetrics = (gridElement: HTMLElement) => {
    const rect = gridElement.getBoundingClientRect();
    const style = getComputedStyle(gridElement);

    const paddingLeft = parseFloat(style.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(style.paddingRight || '0') || 0;
    const paddingTop = parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(style.paddingBottom || '0') || 0;

    const columnGap = parseFloat(style.columnGap || style.gap || '0') || 0;
    const rowGap = parseFloat(style.rowGap || style.gap || '0') || 0;

    const innerWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
    const innerHeight = Math.max(0, rect.height - paddingTop - paddingBottom);

    const cellWidth = GRID_COLS > 0
      ? Math.max(0, (innerWidth - columnGap * (GRID_COLS - 1)) / GRID_COLS)
      : 0;
    const cellHeight = GRID_ROWS > 0
      ? Math.max(0, (innerHeight - rowGap * (GRID_ROWS - 1)) / GRID_ROWS)
      : 0;

    return {
      rect,
      paddingLeft,
      paddingTop,
      innerWidth,
      innerHeight,
      columnGap,
      rowGap,
      cellWidth,
      cellHeight,
    };
  };

  const getCellFromPointer = (
    gridElement: HTMLElement,
    clientX: number,
    clientY: number,
    size?: { width: number; height: number }
  ) => {
    const {
      rect,
      paddingLeft,
      paddingTop,
      innerWidth,
      innerHeight,
      columnGap,
      rowGap,
      cellWidth,
      cellHeight,
    } = getGridMetrics(gridElement);

    if (!rect.width || !rect.height || !cellWidth || !cellHeight) {
      return { col: 0, row: 0 };
    }

    const x = clamp(clientX - rect.left - paddingLeft, 0, Math.max(0, innerWidth - 1));
    const y = clamp(clientY - rect.top - paddingTop, 0, Math.max(0, innerHeight - 1));

    const colStride = cellWidth + columnGap;
    const rowStride = cellHeight + rowGap;

    const maxCol = size ? Math.max(0, GRID_COLS - size.width) : GRID_COLS - 1;
    const maxRow = size ? Math.max(0, GRID_ROWS - size.height) : GRID_ROWS - 1;

    const col = clamp(Math.floor(x / colStride), 0, maxCol);
    const row = clamp(Math.floor(y / rowStride), 0, maxRow);
    return { col, row };
  };

  const isOutOfBounds = (position: { col: number; row: number; width: number; height: number }) => {
    if (position.col < 0 || position.row < 0) return true;
    if (position.width < 1 || position.height < 1) return true;
    if (position.col + position.width > GRID_COLS) return true;
    if (position.row + position.height > GRID_ROWS) return true;
    return false;
  };

  const attemptWidgetMove = (moving: DragInfo, col: number, row: number) => {
    const nextPosition = { col, row, width: moving.width, height: moving.height };
    if (isOutOfBounds(nextPosition)) return false;
    return updateWidgetPositionWithPush(moving.id, nextPosition);
  };

  const endDrag = () => {
    setDragInfo(null);
    setDragPointerId(null);
    setIsDragBlocked(false);
    setHoverCell(null);
    lastDragCellRef.current = null;
  };

  const handleRemoveWidget = (id: string) => {
    removeWidget(id);
  };

  const handleWidgetPointerDown = (e: React.PointerEvent, widget: WidgetGridItem) => {
    if (e.button !== 0) return;
    if (resizeInfo) return;

    const target = e.target as HTMLElement;
    if (target.closest('.grid-widget__remove') || target.closest('.grid-widget__resize-handle')) {
      return;
    }

    e.preventDefault();
    setDragInfo({ id: widget.id, width: widget.position.width, height: widget.position.height });
    setDragPointerId(e.pointerId);
    setIsDragBlocked(false);
    setHoverCell({ col: widget.position.col, row: widget.position.row });
    lastDragCellRef.current = { col: widget.position.col, row: widget.position.row };
  };

  const endResize = () => {
    setResizeInfo(null);
    setResizePointerId(null);
  };

  const handleResizePointerDown = (e: React.PointerEvent, widget: WidgetGridItem) => {
    if (e.button !== 0) return;
    if (dragInfo) return;
    e.preventDefault();
    e.stopPropagation();
    setResizeInfo({
      id: widget.id,
      startWidth: widget.position.width,
      startHeight: widget.position.height,
      startX: e.clientX,
      startY: e.clientY,
    });
    setResizePointerId(e.pointerId);
  };

  useEffect(() => {
    if (!dragInfo || dragPointerId == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      const grid = gridRef.current;
      if (!grid) return;

      const { col, row } = getCellFromPointer(grid, ev.clientX, ev.clientY, {
        width: dragInfo.width,
        height: dragInfo.height,
      });

      const last = lastDragCellRef.current;
      if (last && last.col === col && last.row === row) return;

      lastDragCellRef.current = { col, row };
      setHoverCell({ col, row });

      const ok = attemptWidgetMove(dragInfo, col, row);
      setIsDragBlocked(!ok);
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      endDrag();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [dragInfo, dragPointerId, updateWidgetPositionWithPush]);

  useEffect(() => {
    if (!resizeInfo || resizePointerId == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId) return;
      const grid = gridRef.current;
      if (!grid) return;

      const widget = widgets.find(w => w.id === resizeInfo.id);
      if (!widget) return;

      const { cellWidth, cellHeight } = getGridMetrics(grid);
      if (!cellWidth || !cellHeight) return;

      const deltaX = ev.clientX - resizeInfo.startX;
      const deltaY = ev.clientY - resizeInfo.startY;

      const newWidth = Math.max(1, Math.min(
        Math.round(resizeInfo.startWidth + deltaX / cellWidth),
        GRID_COLS - widget.position.col
      ));
      const newHeight = Math.max(1, Math.min(
        Math.round(resizeInfo.startHeight + deltaY / cellHeight),
        GRID_ROWS - widget.position.row
      ));

      if (newWidth === widget.position.width && newHeight === widget.position.height) return;

      updateWidgetPositionWithPush(widget.id, {
        ...widget.position,
        width: newWidth,
        height: newHeight,
      });
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId) return;
      endResize();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [resizeInfo, resizePointerId, widgets, updateWidgetPositionWithPush]);

  const renderGridCells = () => {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const isHovered = hoverCell?.col === col && hoverCell?.row === row;
        const isInvalidHover = Boolean(
          isHovered &&
          dragInfo &&
          (isDragBlocked || isOutOfBounds({ col, row, width: dragInfo.width, height: dragInfo.height }))
        );
        cells.push(
          <div
            key={`${col}-${row}`}
            className={`grid-cell ${isHovered ? 'grid-cell--hover' : ''} ${isInvalidHover ? 'grid-cell--invalid' : ''}`}
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
      ref={gridRef}
    >
      {renderGridCells()}
      
      {widgets.map((widget) => {
        const WidgetComponent = widgetComponents[widget.widgetType];
        if (!WidgetComponent) return null;

        return (
          <div
            key={widget.id}
            className={`grid-widget ${dragInfo?.id === widget.id ? 'grid-widget--dragging' : ''}`}
            onPointerDown={(e) => handleWidgetPointerDown(e, widget)}
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
              onPointerDown={(e) => handleResizePointerDown(e, widget)}
              title="Drag to resize"
            />
          </div>
        );
      })}
    </div>
  );
}
