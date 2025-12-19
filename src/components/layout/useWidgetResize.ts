import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridConfig, WidgetConstraints, WidgetLayout } from '../../types/layout';
import { clampToRange } from './gridMath';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeParams {
  grid: GridConfig;
  widgets: WidgetLayout[];
  resizeWidget: (id: string, size: { width: number; height: number; x?: number; y?: number }) => Promise<boolean>;
  getCellFromPointer: (clientX: number, clientY: number) => { x: number; y: number };
  getConstraints: (widgetType: string) => WidgetConstraints | undefined;
}

type PendingLayout = { x: number; y: number; width: number; height: number };

export interface ResizeState {
  resizingWidgetId: string | null;
  preview: { x: number; y: number; width: number; height: number } | null;
  isResizeBlocked: boolean;
  beginResize: (widget: WidgetLayout) => void;
  cancelResize: () => void;
  handleResizePointerDown: (e: React.PointerEvent, widget: WidgetLayout, handle: ResizeHandle) => void;
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
    widgetType: string;
    handle: ResizeHandle;
  } | null>(null);
  const originalLayoutRef = useRef<PendingLayout | null>(null);
  const pendingSizeRef = useRef<PendingLayout | null>(null);

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
    pendingSizeRef.current = { x: widget.x, y: widget.y, width: widget.width, height: widget.height };
    setPreview({ x: widget.x, y: widget.y, width: widget.width, height: widget.height });
    setIsResizeBlocked(false);
    setResizingWidgetId(widget.id);
  }, []);

  const applyPendingResize = useCallback(async () => {
    if (!resizingWidgetId) return;
    if (isResizeBlocked) return;
    const pending = pendingSizeRef.current;
    const original = originalLayoutRef.current;
    if (!pending || !original) return;
    const unchanged =
      pending.width === original.width &&
      pending.height === original.height &&
      pending.x === original.x &&
      pending.y === original.y;
    if (unchanged) {
      cancelResize();
      return;
    }
    const ok = await resizeWidget(resizingWidgetId, pending);
    if (ok) {
      cancelResize();
    } else {
      setIsResizeBlocked(true);
    }
  }, [cancelResize, isResizeBlocked, resizeWidget, resizingWidgetId]);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout, handle: ResizeHandle) => {
      if (e.button !== 0) return;
      if (widget.id !== resizingWidgetId) return;
      if (!originalLayoutRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      resizePointerId.current = e.pointerId;
      resizeInfo.current = {
        id: widget.id,
        widgetType: widget.widgetType,
        handle,
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
    const onMove = (ev: PointerEvent) => {
      const activePointer = resizePointerId.current;
      if (activePointer == null || ev.pointerId !== activePointer) return;
      const info = resizeInfo.current;
      const original = originalLayoutRef.current;
      if (!info || !original) return;

      const constraints = getConstraints(info.widgetType);
      const minWidth = constraints?.minWidth ?? 1;
      const minHeight = constraints?.minHeight ?? 1;
      const maxWidth = Math.min(constraints?.maxWidth ?? grid.columns, grid.columns);
      const maxHeight = Math.min(constraints?.maxHeight ?? grid.rows, grid.rows);

      const targetCell = getCellFromPointer(ev.clientX, ev.clientY);

      const affectsWest = info.handle.includes('w');
      const affectsEast = info.handle.includes('e');
      const affectsNorth = info.handle.includes('n');
      const affectsSouth = info.handle.includes('s');

      let nextX = original.x;
      let nextY = original.y;
      let nextWidth = original.width;
      let nextHeight = original.height;

      const anchorRight = original.x + original.width;
      const anchorBottom = original.y + original.height;

      if (affectsEast) {
        const minRight = original.x + minWidth;
        const maxRight = Math.min(original.x + maxWidth, grid.columns);
        const newRight = clampToRange(targetCell.x + 1, minRight, Math.max(minRight, maxRight));
        nextWidth = Math.max(minWidth, newRight - nextX);
      }

      if (affectsWest) {
        const maxWidthAllowed = Math.min(maxWidth, grid.columns);
        const minLeft = Math.max(0, anchorRight - maxWidthAllowed);
        const maxLeft = Math.max(minLeft, anchorRight - minWidth);
        const newLeft = clampToRange(targetCell.x, minLeft, maxLeft);
        nextX = newLeft;
        nextWidth = Math.max(minWidth, anchorRight - newLeft);
      }

      if (affectsSouth) {
        const minBottom = original.y + minHeight;
        const maxBottom = Math.min(original.y + maxHeight, grid.rows);
        const newBottom = clampToRange(targetCell.y + 1, minBottom, Math.max(minBottom, maxBottom));
        nextHeight = Math.max(minHeight, newBottom - nextY);
      }

      if (affectsNorth) {
        const maxHeightAllowed = Math.min(maxHeight, grid.rows);
        const minTop = Math.max(0, anchorBottom - maxHeightAllowed);
        const maxTop = Math.max(minTop, anchorBottom - minHeight);
        const newTop = clampToRange(targetCell.y, minTop, maxTop);
        nextY = newTop;
        nextHeight = Math.max(minHeight, anchorBottom - newTop);
      }

      // Clamp final layout to grid bounds just in case
      nextX = clampToRange(nextX, 0, Math.max(0, grid.columns - nextWidth));
      nextY = clampToRange(nextY, 0, Math.max(0, grid.rows - nextHeight));
      nextWidth = clampToRange(nextWidth, minWidth, Math.min(maxWidth, grid.columns - nextX));
      nextHeight = clampToRange(nextHeight, minHeight, Math.min(maxHeight, grid.rows - nextY));

      const candidate: PendingLayout = { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
      setPreview(candidate);

      const overlaps = widgets.some((other) => other.id !== info.id && rectanglesOverlap(candidate, other));
      if (overlaps) {
        setIsResizeBlocked(true);
        pendingSizeRef.current = null;
      } else {
        setIsResizeBlocked(false);
        pendingSizeRef.current = candidate;
      }
    };

    const onEnd = (ev: PointerEvent) => {
      const activePointer = resizePointerId.current;
      if (activePointer == null || ev.pointerId !== activePointer) return;
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
      void applyPendingResize();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [applyPendingResize, getCellFromPointer, grid.columns, grid.rows, getConstraints, widgets]);

  useEffect(() => {
    if (resizingWidgetId && !widgets.find((w) => w.id === resizingWidgetId)) {
      cancelResize();
    }
  }, [widgets, resizingWidgetId, cancelResize]);

  return {
    resizingWidgetId,
    preview,
    isResizeBlocked,
    beginResize,
    cancelResize,
    handleResizePointerDown,
  };
}
