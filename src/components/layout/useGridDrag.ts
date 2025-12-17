import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetLayout } from '../../types/layout';

type DragInfo = { id: string; widgetType: string; width: number; height: number };

interface DragParams {
  widgets: WidgetLayout[];
  moveWidget: (id: string, coords: { x: number; y: number }) => Promise<boolean>;
  getCellFromPointer: (clientX: number, clientY: number, size?: { width: number; height: number }) => { x: number; y: number };
}

export interface GridDragState {
  dragInfo: DragInfo | null;
  ghostStyle: React.CSSProperties | null;
  hoverCell: { x: number; y: number } | null;
  preview: { x: number; y: number; width: number; height: number } | null;
  isDragBlocked: boolean;
  handleWidgetPointerDown: (e: React.PointerEvent, widget: WidgetLayout) => void;
  cancelDrag: () => void;
}

export default function useGridDrag({ widgets, moveWidget, getCellFromPointer }: DragParams): GridDragState {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [ghostStyle, setGhostStyle] = useState<React.CSSProperties | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [isDragBlocked, setIsDragBlocked] = useState(false);
  const [preview, setPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const dragPointerId = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const queuedTargetRef = useRef<{ x: number; y: number } | null>(null);
  const processingRef = useRef(false);
  const hoverCellRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    hoverCellRef.current = hoverCell;
  }, [hoverCell]);

  const enqueueMove = useCallback(() => {
    if (processingRef.current || !dragInfo) return;
    const target = queuedTargetRef.current;
    if (!target) return;
    queuedTargetRef.current = null;
    processingRef.current = true;

    moveWidget(dragInfo.id, { x: target.x, y: target.y })
      .then((ok) => setIsDragBlocked(!ok))
      .catch(() => setIsDragBlocked(true))
      .finally(() => {
        processingRef.current = false;
        if (queuedTargetRef.current) enqueueMove();
      });
  }, [dragInfo, moveWidget]);

  const cancelDrag = useCallback(() => {
    setDragInfo(null);
    setGhostStyle(null);
    setHoverCell(null);
    setPreview(null);
    setIsDragBlocked(false);
    dragPointerId.current = null;
    queuedTargetRef.current = null;
    processingRef.current = false;
  }, []);

  const handleWidgetPointerDown = useCallback(
    (e: React.PointerEvent, widget: WidgetLayout) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      setDragInfo({ id: widget.id, widgetType: widget.widgetType, width: widget.width, height: widget.height });
      setGhostStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: 30,
        pointerEvents: 'none',
      });
      setHoverCell({ x: widget.x, y: widget.y });
      setPreview({ x: widget.x, y: widget.y, width: widget.width, height: widget.height });

      dragPointerId.current = e.pointerId;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    },
    [],
  );

  useEffect(() => {
    if (dragPointerId.current == null) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId.current) return;
      if (!dragInfo) return;

      const x = ev.clientX - dragOffsetRef.current.x;
      const y = ev.clientY - dragOffsetRef.current.y;
      setGhostStyle((prev) => ({
        ...prev,
        left: `${x}px`,
        top: `${y}px`,
      }));

      const { x: cellX, y: cellY } = getCellFromPointer(ev.clientX, ev.clientY, {
        width: dragInfo.width,
        height: dragInfo.height,
      });

      const last = hoverCellRef.current;
      if (last && last.x === cellX && last.y === cellY) return;
      setHoverCell({ x: cellX, y: cellY });
      setPreview({ x: cellX, y: cellY, width: dragInfo.width, height: dragInfo.height });
      queuedTargetRef.current = { x: cellX, y: cellY };
      enqueueMove();
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId.current) return;
      try {
        const el = ev.target as HTMLElement;
        if (el && typeof el.releasePointerCapture === 'function') {
          el.releasePointerCapture(ev.pointerId);
        }
      } catch {
        // ignore
      }
      cancelDrag();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        cancelDrag();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dragInfo, enqueueMove, getCellFromPointer, cancelDrag]);

  useEffect(() => {
    // Clear previews if the widget being dragged disappears (e.g., removed)
    if (dragInfo && !widgets.find((widget) => widget.id === dragInfo.id)) {
      cancelDrag();
    }
  }, [widgets, dragInfo, cancelDrag]);

  return {
    dragInfo,
    ghostStyle,
    hoverCell,
    preview,
    isDragBlocked,
    handleWidgetPointerDown,
    cancelDrag,
  };
}
