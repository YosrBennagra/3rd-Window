import { useEffect, useRef, useState } from 'react';
import { type WidgetGridItem } from '../../store/gridStore';

type DragInfo = { id: string; width: number; height: number };

type Params = {
  gridRef: React.RefObject<HTMLDivElement | null>;
  widgets: WidgetGridItem[];
  updateWidgetPositionWithPush: (id: string, pos: any) => boolean;
  updateWidgetPosition: (id: string, pos: any) => void;
  getGridMetrics: (el: HTMLElement) => any;
  getCellFromPointer: (el: HTMLElement, x: number, y: number, size?: { width: number; height: number }) => { col: number; row: number };
};

export default function useGridDrag({ gridRef, widgets, updateWidgetPositionWithPush, updateWidgetPosition, getGridMetrics, getCellFromPointer }: Params) {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);
  const [isDragBlocked, setIsDragBlocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCaptureElemRef = useRef<EventTarget | null>(null);
  const [ghostStyle, setGhostStyle] = useState<React.CSSProperties | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastDragCellRef = useRef<{ col: number; row: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  // simple clamp helper (kept if needed later)

  const attemptWidgetMove = (moving: DragInfo, col: number, row: number) => {
    const nextPosition = { col, row, width: moving.width, height: moving.height };
    if (nextPosition.col < 0 || nextPosition.row < 0) return false;
    if (nextPosition.width < 1 || nextPosition.height < 1) return false;
    if (nextPosition.col + nextPosition.width >  Infinity) return false; // guarded by consumer
    return updateWidgetPositionWithPush(moving.id, nextPosition);
  };

  const endDrag = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    const pointerIdLocal = dragPointerId;
    setDragInfo(null);
    setDragPointerId(null);
    setIsDragBlocked(false);
    setIsDragging(false);
    setHoverCell(null);
    lastDragCellRef.current = null;
    dragStartRef.current = null;
    try {
      const el = dragCaptureElemRef.current as unknown as HTMLElement | null;
      if (el && typeof (el as any).releasePointerCapture === 'function' && pointerIdLocal != null) {
        (el as any).releasePointerCapture(pointerIdLocal);
      }
    } catch (e) {}
    dragCaptureElemRef.current = null;
    setGhostStyle(null);
  };

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleWidgetPointerDown = (e: React.PointerEvent, widget: WidgetGridItem) => {
    if (e.button !== 0) return;
    e.preventDefault();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    setDragPointerId(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragCaptureElemRef.current = e.currentTarget;
    } catch (err) {
      dragCaptureElemRef.current = null;
    }

    // Start Long Press Timer
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setIsDragging(true);
      setDragInfo({ id: widget.id, width: widget.position.width, height: widget.position.height });
      
      // Initial ghost style at current position
      const p = lastPointerRef.current || { x: e.clientX, y: e.clientY };
      const x = p.x - dragOffsetRef.current.x;
      const y = p.y - dragOffsetRef.current.y;
      
      setGhostStyle({
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: 9999,
        pointerEvents: 'none',
      });

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400);
  };

  useEffect(() => {
    if (dragPointerId == null) return;

    const process = () => {
      rafRef.current = null;
      const p = lastPointerRef.current;
      if (!p || !dragInfo) return;
      const grid = gridRef.current;
      if (!grid) return;

      // Update Ghost Position to follow cursor
      const x = p.x - dragOffsetRef.current.x;
      const y = p.y - dragOffsetRef.current.y;
      setGhostStyle(prev => ({
        ...prev,
        left: `${x}px`,
        top: `${y}px`,
        position: 'fixed'
      }));

      const { col, row } = getCellFromPointer(grid, p.x, p.y, { width: dragInfo.width, height: dragInfo.height });
      
      const last = lastDragCellRef.current;
      if (last && last.col === col && last.row === row) return;
      lastDragCellRef.current = { col, row };
      setHoverCell({ col, row });

      const ok = attemptWidgetMove(dragInfo, col, row);
      setIsDragBlocked(!ok);
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };

      if (!isDragging) {
        // Check for cancel threshold
        const start = dragStartRef.current;
        if (start) {
          const dx = ev.clientX - start.x;
          const dy = ev.clientY - start.y;
          if (dx * dx + dy * dy > 100) { // 10px threshold
             if (longPressTimerRef.current) {
               clearTimeout(longPressTimerRef.current);
               longPressTimerRef.current = null;
             }
          }
        }
        return;
      }

      if (rafRef.current == null) rafRef.current = requestAnimationFrame(process);
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      endDrag();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        endDrag();
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
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [dragInfo, dragPointerId, isDragging, updateWidgetPositionWithPush, updateWidgetPosition, widgets, getGridMetrics, getCellFromPointer]);

  return {
    dragInfo,
    dragPointerId,
    isDragBlocked,
    ghostStyle,
    hoverCell,
    isDragging,
    handleWidgetPointerDown,
    endDrag,
    cancelDrag: endDrag,
    setGhostStyle,
  };
}
