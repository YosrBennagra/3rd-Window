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
  canConfirmResize: boolean;
  beginResize: (widget: WidgetLayout) => void;
  cancelResize: () => void;
  confirmResize: () => Promise<boolean>;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
}

const rectanglesOverlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) => {
  return !(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y);
};

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
    widgetType: string;
  } | null>(null);
  const originalLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const pendingSizeRef = useRef<{ width: number; height: number } | null>(null);

  const cancelResize = useCallback(() => {
    resizePointerId.current = null;
    resizeInfo.current = null;
    originalLayoutRef.current = null;
    pendingSizeRef.current = null;
    setPreview(null);
    setResizingWidgetId(null);
    setIsResizeBlocked(false);
  }, []);

  const beginResize = useCallback((widget: WidgetLayout) => {
    resizePointerId.current = null;
    resizeInfo.current = null;
    originalLayoutRef.current = { x: widget.x, y: widget.y, width: widget.width, height: widget.height };
    pendingSizeRef.current = { width: widget.width, height: widget.height };
    setPreview({ x: widget.x, y: widget.y, width: widget.width, height: widget.height });
    setIsResizeBlocked(false);
    setResizingWidgetId(widget.id);
  }, []);

  const confirmResize = useCallback(async () => {
    if (!resizingWidgetId || !preview) return false;
    if (isResizeBlocked) return false;
    const original = originalLayoutRef.current;
    const pending = pendingSizeRef.current ?? { width: preview.width, height: preview.height };
    if (!pending) return false;
    if (original && original.width === pending.width && original.height === pending.height) {
      cancelResize();
      return true;
    }
    const ok = await resizeWidget(resizingWidgetId, pending);
    if (ok) {
      cancelResize();
    } else {
      setIsResizeBlocked(true);
    }
    return ok;
  }, [cancelResize, isResizeBlocked, preview, resizeWidget, resizingWidgetId]);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout) => {
      if (e.button !== 0) return;
      if (widget.id !== resizingWidgetId) return;
      e.preventDefault();
      e.stopPropagation();

      resizePointerId.current = e.pointerId;
      resizeInfo.current = {
        id: widget.id,
        startX: widget.x,
        startY: widget.y,
        widgetType: widget.widgetType,
      };

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [resizingWidgetId],
  );

  useEffect(() => {
    if (resizePointerId.current == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId.current) return;
      const info = resizeInfo.current;
      if (!info) return;

      const widget = widgets.find((w) => w.id === info.id);
      if (!widget) return;

      const constraints = getConstraints(info.widgetType);
      const minWidth = constraints?.minWidth ?? 1;
      const minHeight = constraints?.minHeight ?? 1;
      const maxWidth = constraints?.maxWidth ?? grid.columns;
      const maxHeight = constraints?.maxHeight ?? grid.rows;

      const targetCell = getCellFromPointer(ev.clientX, ev.clientY);
      const targetWidth = clampToRange(targetCell.x - info.startX + 1, minWidth, Math.min(maxWidth, grid.columns - info.startX));
      const targetHeight = clampToRange(targetCell.y - info.startY + 1, minHeight, Math.min(maxHeight, grid.rows - info.startY));

      const candidate = { x: info.startX, y: info.startY, width: targetWidth, height: targetHeight };
      setPreview(candidate);

      const overlaps = widgets.some((other) => other.id !== info.id && rectanglesOverlap(candidate, other));
      if (overlaps) {
        setIsResizeBlocked(true);
        pendingSizeRef.current = null;
      } else {
        setIsResizeBlocked(false);
        pendingSizeRef.current = { width: targetWidth, height: targetHeight };
      }
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
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [getCellFromPointer, grid.columns, grid.rows, getConstraints, widgets]);

  useEffect(() => {
    if (resizingWidgetId && !widgets.find((w) => w.id === resizingWidgetId)) {
      cancelResize();
    }
  }, [widgets, resizingWidgetId, cancelResize]);

  const canConfirmResize =
    Boolean(
      resizingWidgetId &&
        preview &&
        pendingSizeRef.current &&
        originalLayoutRef.current &&
        !isResizeBlocked &&
        (pendingSizeRef.current.width !== originalLayoutRef.current.width ||
          pendingSizeRef.current.height !== originalLayoutRef.current.height),
    );

  return {
    resizingWidgetId,
    preview,
    isResizeBlocked,
    canConfirmResize,
    beginResize,
    cancelResize,
    confirmResize,
    handleResizePointerDown,
  };
}
