import React, { useEffect, useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS } from '../../store/gridStore';

type Props = {
  gridRef: React.RefObject<HTMLDivElement | null>;
  colWidths: number[] | null;
  rowHeights: number[] | null;
  setColWidths: (v: number[] | null) => void;
  setRowHeights: (v: number[] | null) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
};

const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 32;
const MIN_PIXEL = 1;
const GAP_SIZE = 12;

const hasSibling = (tracks: number[] | null, index: number) =>
  Array.isArray(tracks) && index >= 0 && index < tracks.length - 1;

const clampPair = (total: number, desiredFirst: number, minSize: number) => {
  if (!Number.isFinite(total) || total <= 0) {
    return { first: 0, second: 0 };
  }
  const effectiveMin = Math.max(MIN_PIXEL, Math.min(minSize, Math.floor(total / 2)));
  const maxFirst = total - effectiveMin;
  if (maxFirst <= effectiveMin) {
    const half = Math.floor(total / 2);
    return { first: half, second: total - half };
  }
  const rawFirst = Number.isFinite(desiredFirst) ? desiredFirst : total / 2;
  const rounded = Math.round(rawFirst);
  const first = Math.max(effectiveMin, Math.min(maxFirst, rounded));
  return { first, second: total - first };
};

const getGridMetrics = (gridElement: HTMLElement) => {
  const rect = gridElement.getBoundingClientRect();
  const style = getComputedStyle(gridElement);
  const paddingLeft = parseFloat(style.paddingLeft || '0') || 0;
  const paddingRight = parseFloat(style.paddingRight || '0') || 0;
  const paddingTop = parseFloat(style.paddingTop || '0') || 0;
  const paddingBottom = parseFloat(style.paddingBottom || '0') || 0;
  
  // Explicit gap size
  const columnGap = GAP_SIZE;
  const rowGap = GAP_SIZE;
  
  const innerWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
  const innerHeight = Math.max(0, rect.height - paddingTop - paddingBottom);
  
  const cellWidth = GRID_COLS > 0
    ? Math.max(0, (innerWidth - columnGap * (GRID_COLS - 1)) / GRID_COLS)
    : 0;
  const cellHeight = GRID_ROWS > 0
    ? Math.max(0, (innerHeight - rowGap * (GRID_ROWS - 1)) / GRID_ROWS)
    : 0;

  return { rect, paddingLeft, paddingTop, innerWidth, innerHeight, columnGap, rowGap, cellWidth, cellHeight } as const;
};

export default function GridResizers({ gridRef, colWidths, rowHeights, setColWidths, setRowHeights, onResizeStart, onResizeEnd }: Props) {
  const colResizingRef = useRef<null | { index: number; startX: number; startWidths: number[] }>(null);
  const rowResizingRef = useRef<null | { index: number; startY: number; startHeights: number[] }>(null);
  const colCaptureElemRef = useRef<HTMLElement | null>(null);
  const rowCaptureElemRef = useRef<HTMLElement | null>(null);
  const [colResizerPointerId, setColResizerPointerId] = useState<number | null>(null);
  const [rowResizerPointerId, setRowResizerPointerId] = useState<number | null>(null);

  // Cleanup pointer capture on unmount
  useEffect(() => {
    return () => {
      if (colCaptureElemRef.current && colResizerPointerId != null) {
        try {
          colCaptureElemRef.current.releasePointerCapture(colResizerPointerId);
        } catch {}
      }
      if (rowCaptureElemRef.current && rowResizerPointerId != null) {
        try {
          rowCaptureElemRef.current.releasePointerCapture(rowResizerPointerId);
        } catch {}
      }
    };
  }, [colResizerPointerId, rowResizerPointerId]);

  const handleColResizerPointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    let currentWidths = colWidths;
    if (!currentWidths) {
      const grid = gridRef.current;
      if (!grid) return;
      const metrics = getGridMetrics(grid);
      currentWidths = Array(GRID_COLS).fill(metrics.cellWidth);
      setColWidths(currentWidths);
    }

    if (!hasSibling(currentWidths, index)) return;

    colResizingRef.current = { index, startX: e.clientX, startWidths: [...currentWidths] };
    setColResizerPointerId(e.pointerId);
    onResizeStart?.();
    try {
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      colCaptureElemRef.current = el;
    } catch {
      colCaptureElemRef.current = null;
    }
  };

  useEffect(() => {
    if (!colResizingRef.current || colResizerPointerId == null) return;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== colResizerPointerId) return;
      const info = colResizingRef.current; if (!info) return;
      
      const minW = MIN_COL_WIDTH;
      const dx = ev.clientX - info.startX;
      const i = info.index;
      const start = info.startWidths;

      if (i < 0 || i >= start.length - 1) return;
      const pairTotal = start[i] + start[i + 1];
      const desiredLeft = start[i] + dx;
      const { first: leftNew, second: rightNew } = clampPair(pairTotal, desiredLeft, minW);

      const newWidths = [...start];
      newWidths[i] = leftNew;
      newWidths[i + 1] = rightNew;
      setColWidths(newWidths);
    };
    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== colResizerPointerId) return;
      try {
        if (colCaptureElemRef.current && typeof (colCaptureElemRef.current as any).releasePointerCapture === 'function') {
          (colCaptureElemRef.current as any).releasePointerCapture(colResizerPointerId);
        }
      } catch {}
      colCaptureElemRef.current = null;
      colResizingRef.current = null;
      setColResizerPointerId(null);
      onResizeEnd?.();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [colResizerPointerId, setColWidths, onResizeEnd]);

  const handleRowResizerPointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    let currentHeights = rowHeights;
    if (!currentHeights) {
      const grid = gridRef.current;
      if (!grid) return;
      const metrics = getGridMetrics(grid);
      currentHeights = Array(GRID_ROWS).fill(metrics.cellHeight);
      setRowHeights(currentHeights);
    }

    if (!hasSibling(currentHeights, index)) return;

    rowResizingRef.current = { index, startY: e.clientY, startHeights: [...currentHeights] };
    setRowResizerPointerId(e.pointerId);
    onResizeStart?.();
    try {
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      rowCaptureElemRef.current = el;
    } catch {
      rowCaptureElemRef.current = null;
    }
  };

  useEffect(() => {
    if (!rowResizingRef.current || rowResizerPointerId == null) return;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== rowResizerPointerId) return;
      const info = rowResizingRef.current; if (!info) return;
      
      const minH = MIN_ROW_HEIGHT;
      const dy = ev.clientY - info.startY;
      const i = info.index;
      const start = info.startHeights;

      if (i < 0 || i >= start.length - 1) return;
      const pairTotal = start[i] + start[i + 1];
      const desiredTop = start[i] + dy;
      const { first: topNew, second: bottomNew } = clampPair(pairTotal, desiredTop, minH);

      const newHeights = [...start];
      newHeights[i] = topNew;
      newHeights[i + 1] = bottomNew;
      setRowHeights(newHeights);
    };
    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== rowResizerPointerId) return;
      try {
        if (rowCaptureElemRef.current && typeof (rowCaptureElemRef.current as any).releasePointerCapture === 'function') {
          (rowCaptureElemRef.current as any).releasePointerCapture(rowResizerPointerId);
        }
      } catch {}
      rowCaptureElemRef.current = null;
      rowResizingRef.current = null;
      setRowResizerPointerId(null);
      onResizeEnd?.();
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onEnd); window.addEventListener('pointercancel', onEnd);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onEnd); window.removeEventListener('pointercancel', onEnd); };
  }, [rowResizerPointerId, setRowHeights, onResizeEnd]);

  const nodes: React.ReactNode[] = [];
  
  // Render column resizers in even tracks (2, 4, 6...)
  for (let i = 0; i < GRID_COLS - 1; i++) {
    const isActive = colResizerPointerId != null && colResizingRef.current?.index === i;
    nodes.push(
      <div
        key={`col-resizer-${i}`}
        className={`grid-resizer ${isActive ? 'grid-resizer--active' : ''}`}
        style={{ 
          gridColumn: `${(i + 1) * 2} / span 1`,
          gridRow: '1 / -1',
          position: 'relative',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0
        }}
        onPointerDown={(e) => handleColResizerPointerDown(e, i)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // Render row resizers in even tracks (2, 4, 6...)
  for (let j = 0; j < GRID_ROWS - 1; j++) {
    const isActive = rowResizerPointerId != null && rowResizingRef.current?.index === j;
    nodes.push(
      <div
        key={`row-resizer-${j}`}
        className={`grid-resizer grid-resizer--row ${isActive ? 'grid-resizer--active' : ''}`}
        style={{ 
          gridRow: `${(j + 1) * 2} / span 1`,
          gridColumn: '1 / -1',
          position: 'relative',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0
        }}
        onPointerDown={(e) => handleRowResizerPointerDown(e, j)}
        role="separator"
        aria-orientation="horizontal"
      />
    );
  }

  return <>{nodes}</>;
}
