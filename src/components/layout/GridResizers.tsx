import React, { useEffect, useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS } from '../../store/gridStore';

type Props = {
  gridRef: React.RefObject<HTMLDivElement | null>;
  colWidths: number[] | null;
  rowHeights: number[] | null;
  setColWidths: (v: number[] | null) => void;
  setRowHeights: (v: number[] | null) => void;
};

const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 32;
const MIN_PIXEL = 1;

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
  const columnGap = parseFloat(style.columnGap || style.gap || '0') || 0;
  const rowGap = parseFloat(style.rowGap || style.gap || '0') || 0;
  const innerWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
  const innerHeight = Math.max(0, rect.height - paddingTop - paddingBottom);
  return { rect, paddingLeft, paddingTop, innerWidth, innerHeight, columnGap, rowGap } as const;
};

export default function GridResizers({ gridRef, colWidths, rowHeights, setColWidths, setRowHeights }: Props) {
  const colResizingRef = useRef<null | { index: number; startX: number; startWidths: number[] }>(null);
  const rowResizingRef = useRef<null | { index: number; startY: number; startHeights: number[] }>(null);
  const colCaptureElemRef = useRef<HTMLElement | null>(null);
  const rowCaptureElemRef = useRef<HTMLElement | null>(null);
  const [colResizerPointerId, setColResizerPointerId] = useState<number | null>(null);
  const [rowResizerPointerId, setRowResizerPointerId] = useState<number | null>(null);
  const [gridElement, setGridElement] = useState<HTMLElement | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let raf: number | null = null;
    let ro: ResizeObserver | null = null;
    let cleanupWindow: (() => void) | null = null;

    const attach = () => {
      const grid = gridRef.current;
      if (!grid) {
        raf = requestAnimationFrame(attach);
        return;
      }
      setGridElement(grid);

      if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => forceRender(v => v + 1));
        ro.observe(grid);
      } else {
        const onResize = () => forceRender(v => v + 1);
        window.addEventListener('resize', onResize);
        cleanupWindow = () => window.removeEventListener('resize', onResize);
      }
    };

    attach();
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (cleanupWindow) cleanupWindow();
    };
  }, [gridRef]);

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
    if (!colWidths || !hasSibling(colWidths, index)) return;
    e.preventDefault();
    e.stopPropagation();
    colResizingRef.current = { index, startX: e.clientX, startWidths: [...colWidths] };
    setColResizerPointerId(e.pointerId);
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
      const grid = gridRef.current; if (!grid) return;
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
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
    }, [colResizerPointerId, gridRef, setColWidths]);

  const handleRowResizerPointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return;
    if (!rowHeights || !hasSibling(rowHeights, index)) return;
    e.preventDefault();
    e.stopPropagation();
    rowResizingRef.current = { index, startY: e.clientY, startHeights: [...rowHeights] };
    setRowResizerPointerId(e.pointerId);
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
      const info = rowResizingRef.current; if (!info) return; const grid = gridRef.current; if (!grid) return;
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
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onEnd); window.addEventListener('pointercancel', onEnd);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onEnd); window.removeEventListener('pointercancel', onEnd); };
  }, [rowResizerPointerId, gridRef, setRowHeights]);

  // render handles
  const grid = gridElement;
  if (!grid || (!colWidths && !rowHeights)) return null;
  const metrics = getGridMetrics(grid) as any;
  const { paddingLeft, paddingTop, columnGap, innerHeight, innerWidth, rowGap } = metrics;
  const nodes: React.ReactNode[] = [];
  if (colWidths) {
    let sum = 0;
    for (let i = 0; i < GRID_COLS - 1; i++) {
      sum += colWidths[i];
      const left = paddingLeft + sum + i * columnGap + columnGap / 2;
      const isActive = colResizerPointerId != null && colResizingRef.current?.index === i;
      nodes.push(
        <div
          key={`col-resizer-${i}`}
          className={`grid-resizer ${isActive ? 'grid-resizer--active' : ''}`}
          style={{ left: `${left}px`, top: `${paddingTop}px`, height: `${innerHeight}px` }}
          onPointerDown={(e) => handleColResizerPointerDown(e, i)}
          role="separator"
          aria-orientation="vertical"
        />
      );
    }
  }
  if (rowHeights) {
    let sum = 0;
    for (let j = 0; j < GRID_ROWS - 1; j++) {
      sum += rowHeights[j];
      const top = paddingTop + sum + j * rowGap + rowGap / 2;
      const isActive = rowResizerPointerId != null && rowResizingRef.current?.index === j;
      nodes.push(
        <div
          key={`row-resizer-${j}`}
          className={`grid-resizer grid-resizer--row ${isActive ? 'grid-resizer--active' : ''}`}
          style={{ top: `${top}px`, left: `${paddingLeft}px`, width: `${innerWidth}px` }}
          onPointerDown={(e) => handleRowResizerPointerDown(e, j)}
          role="separator"
          aria-orientation="horizontal"
        />
      );
    }
  }

  return <>{nodes}</>;
}
