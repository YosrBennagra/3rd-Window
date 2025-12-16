import React, { useEffect, useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS } from '../../store/gridStore';

type Props = {
  gridRef: React.RefObject<HTMLDivElement | null>;
  colWidths: number[] | null;
  rowHeights: number[] | null;
  setColWidths: (v: number[] | null) => void;
  setRowHeights: (v: number[] | null) => void;
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
  const [mounted, setMounted] = useState(false);
  const [, setRev] = useState(0);

  // ensure we render resizers once the gridRef is attached and on resizes
  useEffect(() => {
    let raf = 0;
    const check = () => {
      if (gridRef.current) {
        setMounted(true);
        return;
      }
      raf = requestAnimationFrame(check);
    };
    check();
    const onResize = () => setRev(r => r + 1);
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [gridRef]);

  const handleColResizerPointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    if (!colWidths) return;
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
      const minW = 40;
      const dx = ev.clientX - info.startX;
      const i = info.index;
      const start = info.startWidths;

      const pairTotal = start[i] + start[i + 1];
      if (!Number.isFinite(pairTotal) || pairTotal <= 0) return;

      const minForPair = Math.min(minW, Math.floor(pairTotal / 2));
      const leftMin = Math.max(16, minForPair);
      const leftMax = Math.max(leftMin, pairTotal - leftMin);
      const leftNew = Math.max(leftMin, Math.min(start[i] + dx, leftMax));
      const rightNew = Math.max(leftMin, pairTotal - leftNew);

      const newWidths = [...start];
      newWidths[i] = Math.round(leftNew);
      newWidths[i + 1] = Math.round(rightNew);
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
    e.preventDefault(); e.stopPropagation(); const grid = gridRef.current; if (!grid) return;
    if (!rowHeights) return;
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
      const minH = 32;
      const dy = ev.clientY - info.startY;
      const i = info.index;
      const start = info.startHeights;

      const pairTotal = start[i] + start[i + 1];
      if (!Number.isFinite(pairTotal) || pairTotal <= 0) return;

      const minForPair = Math.min(minH, Math.floor(pairTotal / 2));
      const topMin = Math.max(16, minForPair);
      const topMax = Math.max(topMin, pairTotal - topMin);
      const topNew = Math.max(topMin, Math.min(start[i] + dy, topMax));
      const bottomNew = Math.max(topMin, pairTotal - topNew);

      const newHeights = [...start];
      newHeights[i] = Math.round(topNew);
      newHeights[i + 1] = Math.round(bottomNew);
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
  const grid = gridRef.current;
  if (!grid || !mounted) return null;
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
