import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridConfig, WidgetConstraints, WidgetLayout } from '../../types/layout';
import { clampToRange } from './gridMath';

interface ResizeParams {
  grid: GridConfig;
  widgets: WidgetLayout[];
  resizeWidget: (id: string, size: { width: number; height: number }) => Promise<boolean>;
  getCellFromPointer: (clientX: number, clientY: number) => { x: number; y: number };
  getConstraints: (widgetType: string) => WidgetConstraints | undefined;
}

export interface ResizeState {
  resizingWidgetId: string | null;
  preview: { x: number; y: number; width: number; height: number } | null;
  isResizeBlocked: boolean;
  setResizingWidgetId: (id: string | null) => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
}

export function useWidgetResize({
  grid,
  widgets,
  resizeWidget,
  getCellFromPointer,
  getConstraints,
}: ResizeParams): ResizeState {
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isResizeBlocked, setIsResizeBlocked] = useState(false);

  const resizePointerId = useRef<number | null>(null);
  const resizeInfo = useRef<{
    id: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    widgetType: string;
  } | null>(null);
  const queuedSizeRef = useRef<{ width: number; height: number } | null>(null);
  const processingRef = useRef(false);

  const enqueueResize = useCallback(() => {
    if (processingRef.current || !resizeInfo.current || !queuedSizeRef.current) return;
    const target = queuedSizeRef.current;
    queuedSizeRef.current = null;
    processingRef.current = true;

    resizeWidget(resizeInfo.current.id, target)
      .then((ok) => setIsResizeBlocked(!ok))
      .catch(() => setIsResizeBlocked(true))
      .finally(() => {
        processingRef.current = false;
        if (queuedSizeRef.current) enqueueResize();
      });
  }, [resizeWidget]);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      resizePointerId.current = e.pointerId;
      resizeInfo.current = {
        id: widget.id,
        startX: widget.x,
        startY: widget.y,
        startWidth: widget.width,
        startHeight: widget.height,
        widgetType: widget.widgetType,
      };
      setResizingWidgetId(widget.id);
      setPreview({ x: widget.x, y: widget.y, width: widget.width, height: widget.height });

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [],
  );

  useEffect(() => {
    if (resizePointerId.current == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId.current) return;
      const info = resizeInfo.current;
      if (!info) return;

      const widget = widgets.find((w) => w.id === info.id);
      if (!widget) return;

      const constraints = getConstraints(widget.widgetType);
      const minWidth = constraints?.minWidth ?? 1;
      const minHeight = constraints?.minHeight ?? 1;
      const maxWidth = constraints?.maxWidth ?? grid.columns;
      const maxHeight = constraints?.maxHeight ?? grid.rows;

      const targetCell = getCellFromPointer(ev.clientX, ev.clientY);
      const targetWidth = clampToRange(targetCell.x - info.startX + 1, minWidth, Math.min(maxWidth, grid.columns - info.startX));
      const targetHeight = clampToRange(targetCell.y - info.startY + 1, minHeight, Math.min(maxHeight, grid.rows - info.startY));

      if (targetWidth === widget.width && targetHeight === widget.height) return;

      const nextPreview = { x: widget.x, y: widget.y, width: targetWidth, height: targetHeight };
      setPreview(nextPreview);
      queuedSizeRef.current = { width: targetWidth, height: targetHeight };
      enqueueResize();
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId.current) return;
      try {
        const el = ev.target as HTMLElement;
        if (el && typeof el.releasePointerCapture === 'function') {
          el.releasePointerCapture(ev.pointerId);
        }
      } catch {
        // ignore
      }
      resizePointerId.current = null;
      resizeInfo.current = null;
      queuedSizeRef.current = null;
      processingRef.current = false;
      setResizingWidgetId(null);
      setPreview(null);
      setIsResizeBlocked(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [enqueueResize, getCellFromPointer, grid.columns, grid.rows, getConstraints, widgets]);

  useEffect(() => {
    if (resizingWidgetId && !widgets.find((w) => w.id === resizingWidgetId)) {
      setResizingWidgetId(null);
      setPreview(null);
    }
  }, [widgets, resizingWidgetId]);

  return {
    resizingWidgetId,
    preview,
    isResizeBlocked,
    setResizingWidgetId,
    handleResizePointerDown,
  };
}
