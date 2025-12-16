import { useEffect, useRef, useState } from 'react';
import { useGridStore, type WidgetGridItem, GRID_COLS, GRID_ROWS } from '../../store/gridStore';
import GridResizers from './GridResizers';
import GridGhost from './GridGhost';
import useGridDrag from './useGridDrag';
import { ClockWidget, CpuTempWidget, GpuTempWidget } from '../widgets';
import GridCells from './GridCells';
import GridWidgetItem from './GridWidgetItem';
import './DraggableGrid.css';

const widgetComponents: Record<string, React.ComponentType> = {
  'clock': ClockWidget,
  'cpu-temp': CpuTempWidget,
  'gpu-temp': GpuTempWidget,
};

type ResizeInfo = { id: string; startWidth: number; startHeight: number; startX: number; startY: number };

export function DraggableGrid() {
  const { widgets, updateWidgetPositionWithPush, updateWidgetPosition, removeWidget } = useGridStore();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [colWidths, setColWidths] = useState<number[] | null>(null);
  const [rowHeights, setRowHeights] = useState<number[] | null>(null);
  
  
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null);
  const [resizePointerId, setResizePointerId] = useState<number | null>(null);
  const resizeCaptureElemRef = useRef<EventTarget | null>(null);

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
      customColWidths: colWidths,
      customRowHeights: rowHeights,
    } as const;
  };

  const getCellFromPointer = (
    gridElement: HTMLElement,
    clientX: number,
    clientY: number,
    size?: { width: number; height: number }
  ) => {
    const metrics = getGridMetrics(gridElement) as any;
    const rect = metrics.rect as DOMRect;
    const paddingLeft = metrics.paddingLeft as number;
    const paddingTop = metrics.paddingTop as number;
    const innerWidth = metrics.innerWidth as number;
    const innerHeight = metrics.innerHeight as number;
    const columnGap = metrics.columnGap as number;
    const rowGap = metrics.rowGap as number;
    const cellWidth = metrics.cellWidth as number;
    const cellHeight = metrics.cellHeight as number;
    const customColWidths = metrics.customColWidths as number[] | null;
    const customRowHeights = metrics.customRowHeights as number[] | null;

    if (!rect.width || !rect.height || !cellWidth || !cellHeight) {
      return { col: 0, row: 0 };
    }

    const x = clamp(clientX - rect.left - paddingLeft, 0, Math.max(0, innerWidth - 1));
    const y = clamp(clientY - rect.top - paddingTop, 0, Math.max(0, innerHeight - 1));

    const rowStride = cellHeight + rowGap;

    const maxCol = size ? Math.max(0, GRID_COLS - size.width) : GRID_COLS - 1;
    const maxRow = size ? Math.max(0, GRID_ROWS - size.height) : GRID_ROWS - 1;

    let col = 0;
    if (customColWidths && customColWidths.length === GRID_COLS) {
      // compute column by summing widths + gaps
      let acc = 0;
      for (let c = 0; c < GRID_COLS; c++) {
        const w = customColWidths[c] + (c > 0 ? columnGap : 0);
        if (x < acc + w) {
          col = c;
          break;
        }
        acc += w;
        col = c;
      }
      col = clamp(col, 0, maxCol);
    } else {
      const colStride = cellWidth + columnGap;
      col = clamp(Math.floor(x / colStride), 0, maxCol);
    }
    let row = 0;
    if (customRowHeights && customRowHeights.length === GRID_ROWS) {
      let acc = 0;
      for (let r = 0; r < GRID_ROWS; r++) {
        const h = customRowHeights[r] + (r > 0 ? rowGap : 0);
        if (y < acc + h) {
          row = r;
          break;
        }
        acc += h;
        row = r;
      }
      row = clamp(row, 0, maxRow);
    } else {
      row = clamp(Math.floor(y / rowStride), 0, maxRow);
    }
    return { col, row };
  };

  // now that helpers are defined, initialize drag hook
  const {
    dragInfo,
    isDragBlocked,
    ghostStyle,
    swapCandidateId,
    hoverCell,
    handleWidgetPointerDown,
  } = useGridDrag({
    gridRef,
    widgets,
    updateWidgetPositionWithPush,
    updateWidgetPosition,
    getGridMetrics,
    getCellFromPointer,
  });

  

  const isOutOfBounds = (position: { col: number; row: number; width: number; height: number }) => {
    if (position.col < 0 || position.row < 0) return true;
    if (position.width < 1 || position.height < 1) return true;
    if (position.col + position.width > GRID_COLS) return true;
    if (position.row + position.height > GRID_ROWS) return true;
    return false;
  };

  const handleRemoveWidget = (id: string) => {
    removeWidget(id);
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
    // pointer capture to keep resize active if the pointer leaves the handle
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      resizeCaptureElemRef.current = e.currentTarget;
    } catch (err) {
      resizeCaptureElemRef.current = null;
    }
  };

  

  

  const computeEqualTracks = (available: number, count: number, min: number) => {
    const safeAvailable = Math.max(0, Math.floor(available));
    const base = Math.floor(safeAvailable / count);
    const remainder = safeAvailable - base * count;
    return Array.from({ length: count }, (_, i) => Math.max(min, base + (i < remainder ? 1 : 0)));
  };

  // initialize equal column/row tracks and keep them in sync with container resizes
  useEffect(() => {
    const compute = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const { innerWidth, innerHeight, columnGap, rowGap } = getGridMetrics(grid) as any;
      const totalGaps = columnGap * (GRID_COLS - 1);
      const availableW = Math.max(0, innerWidth - totalGaps);
      setColWidths(computeEqualTracks(availableW, GRID_COLS, 40));

      const totalRowGaps = rowGap * (GRID_ROWS - 1);
      const availableH = Math.max(0, innerHeight - totalRowGaps);
      setRowHeights(computeEqualTracks(availableH, GRID_ROWS, 32));
    };
    compute();

    const scaleTracks = (tracks: number[] | null, available: number, min: number, count: number) => {
      if (!tracks || tracks.length !== count) return computeEqualTracks(available, count, min);
      const currentTotal = tracks.reduce((a, b) => a + b, 0);
      if (currentTotal <= 0) return tracks;
      const ratio = available / currentTotal;
      const scaled = tracks.map(w => Math.max(min, Math.round(w * ratio)));
      const scaledTotal = scaled.reduce((a, b) => a + b, 0);
      const diff = Math.round(available - scaledTotal);
      if (diff !== 0) {
        const last = scaled.length - 1;
        const next = scaled[last] + diff;
        if (next >= min) scaled[last] = next;
      }
      return scaled;
    };

    const onResize = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const { innerWidth, innerHeight, columnGap, rowGap } = getGridMetrics(grid) as any;
      const totalGaps = columnGap * (GRID_COLS - 1);
      const availableW = Math.max(0, innerWidth - totalGaps);
      setColWidths(prev => scaleTracks(prev, availableW, 40, GRID_COLS));

      const totalRowGaps = rowGap * (GRID_ROWS - 1);
      const availableH = Math.max(0, innerHeight - totalRowGaps);
      setRowHeights(prev => scaleTracks(prev, availableH, 32, GRID_ROWS));
    };

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => onResize());
      if (gridRef.current) ro.observe(gridRef.current);
    } catch {
      ro = null;
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!resizeInfo || resizePointerId == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId) return;
      const grid = gridRef.current;
      if (!grid) return;

      const widget = widgets.find(w => w.id === resizeInfo.id);
      if (!widget) return;

      const metrics = getGridMetrics(grid) as any;
      const { cellWidth, cellHeight, customColWidths, rowGap } = metrics;
      if ((!cellWidth && !customColWidths) || !cellHeight) return;

      const deltaX = ev.clientX - resizeInfo.startX;
      const deltaY = ev.clientY - resizeInfo.startY;

      let newWidth = widget.position.width;
      if (customColWidths && customColWidths.length === GRID_COLS) {
        // compute start pixel width
        const startCol = widget.position.col;
        const startCount = resizeInfo.startWidth;
        let startPixel = 0;
        for (let i = 0; i < startCount; i++) {
          startPixel += customColWidths[startCol + i] + (i > 0 ? metrics.columnGap : 0);
        }
        const desiredPixel = Math.max(1, startPixel + deltaX);
        // find number of columns that fit desiredPixel
        let acc = 0;
        let cols = 0;
        while (cols < GRID_COLS - startCol && acc < desiredPixel) {
          acc += customColWidths[startCol + cols] + (cols > 0 ? metrics.columnGap : 0);
          cols++;
        }
        newWidth = clamp(cols, 1, GRID_COLS - widget.position.col);
      } else if (cellWidth) {
        newWidth = Math.max(1, Math.min(
          Math.round(resizeInfo.startWidth + deltaX / cellWidth),
          GRID_COLS - widget.position.col
        ));
      }

      let newHeight = widget.position.height;
      if (rowHeights && rowHeights.length === GRID_ROWS) {
        const startRow = widget.position.row;
        const startCount = resizeInfo.startHeight;
        let startPixel = 0;
        for (let i = 0; i < startCount; i++) {
          startPixel += rowHeights[startRow + i] + (i > 0 ? rowGap : 0);
        }
        const desiredPixel = Math.max(1, startPixel + deltaY);
        let acc = 0;
        let rows = 0;
        while (rows < GRID_ROWS - startRow && acc < desiredPixel) {
          acc += rowHeights[startRow + rows] + (rows > 0 ? rowGap : 0);
          rows++;
        }
        newHeight = clamp(rows, 1, GRID_ROWS - widget.position.row);
      } else if (cellHeight) {
        newHeight = Math.max(1, Math.min(
          Math.round(resizeInfo.startHeight + deltaY / cellHeight),
          GRID_ROWS - widget.position.row
        ));
      }

      if (newWidth === widget.position.width && newHeight === widget.position.height) return;

      updateWidgetPositionWithPush(widget.id, {
        ...widget.position,
        width: newWidth,
        height: newHeight,
      });
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId) return;
      // release pointer capture if set
      try {
        const el = resizeCaptureElemRef.current as unknown as HTMLElement | null;
        if (el && typeof (el as any).releasePointerCapture === 'function') {
          (el as any).releasePointerCapture(resizePointerId);
        }
      } catch (e) {
        // ignore
      }
      resizeCaptureElemRef.current = null;
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

  // grid cells rendering moved to GridCells component

  const gridStyle: React.CSSProperties = {
    position: 'relative',
    gridTemplateColumns: colWidths ? colWidths.map((w) => `${w}px`).join(' ') : undefined,
    gridTemplateRows: rowHeights ? rowHeights.map((h) => `${h}px`).join(' ') : undefined,
  };

  

  return (
    <div 
      className="draggable-grid"
      ref={gridRef}
      style={gridStyle}
    >
      <GridCells hoverCell={hoverCell} dragInfo={dragInfo} isDragBlocked={isDragBlocked} isOutOfBounds={isOutOfBounds} />
      <GridResizers gridRef={gridRef} colWidths={colWidths} rowHeights={rowHeights} setColWidths={setColWidths} setRowHeights={setRowHeights} />
      
      {widgets.map((widget) => {
        const WidgetComponent = widgetComponents[widget.widgetType];
        if (!WidgetComponent) return null;
        return (
          <GridWidgetItem
            key={widget.id}
            widget={widget}
            WidgetComponent={WidgetComponent}
            handleWidgetPointerDown={handleWidgetPointerDown}
            handleRemoveWidget={handleRemoveWidget}
            handleResizePointerDown={handleResizePointerDown}
            dragInfo={dragInfo}
          />
        );
      })}
      <GridGhost ghostStyle={ghostStyle} dragInfo={dragInfo} swapCandidateId={swapCandidateId} widgets={widgets} widgetComponents={widgetComponents} />
    </div>
  );
}
