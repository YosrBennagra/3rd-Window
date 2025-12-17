import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetGridItem } from '../../store/gridStore';
import type useGridDrag from './useGridDrag';
import type { GridMetrics } from './useGridTracks';
import { clampToRange } from './gridMath';
import { GRID_COLS, GRID_ROWS } from '../../store/gridStore';

type ResizeInfo = { id: string; startWidth: number; startHeight: number; startX: number; startY: number };

interface UseWidgetResizeParams {
  gridRef: React.RefObject<HTMLDivElement | null>;
  widgets: WidgetGridItem[];
  getGridMetrics: () => GridMetrics | null;
  updateWidgetPositionWithPush: (id: string, position: WidgetGridItem['position']) => boolean;
  dragInfo: ReturnType<typeof useGridDrag>['dragInfo'];
}

export function useWidgetResize({
  gridRef,
  widgets,
  getGridMetrics,
  updateWidgetPositionWithPush,
  dragInfo,
}: UseWidgetResizeParams) {
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null);
  const [resizePointerId, setResizePointerId] = useState<number | null>(null);
  const resizeCaptureElemRef = useRef<EventTarget | null>(null);
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, widget: WidgetGridItem) => {
      if (e.button !== 0) return;
      if (dragInfo) return;
      e.preventDefault();
      e.stopPropagation();
      setResizingWidgetId(widget.id);
      setResizeInfo({
        id: widget.id,
        startWidth: widget.position.width,
        startHeight: widget.position.height,
        startX: e.clientX,
        startY: e.clientY,
      });
      setResizePointerId(e.pointerId);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        resizeCaptureElemRef.current = e.currentTarget;
      } catch {
        resizeCaptureElemRef.current = null;
      }
    },
    [dragInfo],
  );

  useEffect(() => {
    if (!resizeInfo || resizePointerId == null) return;

    const endResize = () => {
      setResizeInfo(null);
      setResizePointerId(null);
      setResizingWidgetId(null);
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizePointerId) return;
      const grid = gridRef.current;
      if (!grid) return;

      const widget = widgets.find((w) => w.id === resizeInfo.id);
      if (!widget) return;

      const metrics = getGridMetrics();
      if (!metrics) return;
      const { cellWidth, cellHeight, customColWidths, customRowHeights, rowGap, columnGap } = metrics;
      if ((!cellWidth && !customColWidths) || !cellHeight) return;

      const deltaX = ev.clientX - resizeInfo.startX;
      const deltaY = ev.clientY - resizeInfo.startY;

      let newWidth = widget.position.width;
      if (customColWidths && customColWidths.length === GRID_COLS) {
        const startCol = widget.position.col;
        const startCount = resizeInfo.startWidth;
        let startPixel = 0;
        for (let index = 0; index < startCount; index++) {
          startPixel += customColWidths[startCol + index] + (index > 0 ? columnGap : 0);
        }
        const desiredPixel = Math.max(1, startPixel + deltaX);
        let acc = 0;
        let cols = 0;
        while (cols < GRID_COLS - startCol && acc < desiredPixel) {
          acc += customColWidths[startCol + cols] + (cols > 0 ? columnGap : 0);
          cols++;
        }
        newWidth = clampToRange(cols, 1, GRID_COLS - widget.position.col);
      } else if (cellWidth) {
        newWidth = Math.max(
          1,
          Math.min(Math.round(resizeInfo.startWidth + deltaX / cellWidth), GRID_COLS - widget.position.col),
        );
      }

      let newHeight = widget.position.height;
      if (customRowHeights && customRowHeights.length === GRID_ROWS) {
        const startRow = widget.position.row;
        const startCount = resizeInfo.startHeight;
        let startPixel = 0;
        for (let index = 0; index < startCount; index++) {
          startPixel += customRowHeights[startRow + index] + (index > 0 ? rowGap : 0);
        }
        const desiredPixel = Math.max(1, startPixel + deltaY);
        let acc = 0;
        let rows = 0;
        while (rows < GRID_ROWS - startRow && acc < desiredPixel) {
          acc += customRowHeights[startRow + rows] + (rows > 0 ? rowGap : 0);
          rows++;
        }
        newHeight = clampToRange(rows, 1, GRID_ROWS - widget.position.row);
      } else if (cellHeight) {
        newHeight = Math.max(
          1,
          Math.min(Math.round(resizeInfo.startHeight + deltaY / cellHeight), GRID_ROWS - widget.position.row),
        );
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
      try {
        const el = resizeCaptureElemRef.current as HTMLElement | null;
        if (el && typeof el.releasePointerCapture === 'function') {
          el.releasePointerCapture(resizePointerId);
        }
      } catch {
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
  }, [dragInfo, getGridMetrics, gridRef, resizeInfo, resizePointerId, updateWidgetPositionWithPush, widgets]);

  return {
    resizingWidgetId,
    setResizingWidgetId,
    handleResizePointerDown,
  };
}
