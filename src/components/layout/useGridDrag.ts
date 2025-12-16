import { useEffect, useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS, type WidgetGridItem } from '../../store/gridStore';

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
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartedRef = useRef<boolean>(false);
  const dragCaptureElemRef = useRef<EventTarget | null>(null);
  const [ghostStyle, setGhostStyle] = useState<React.CSSProperties | null>(null);
  const [swapCandidateId, setSwapCandidateId] = useState<string | null>(null);
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
    const pointerIdLocal = dragPointerId;
    setDragInfo(null);
    setDragPointerId(null);
    setIsDragBlocked(false);
    setHoverCell(null);
    lastDragCellRef.current = null;
    dragStartRef.current = null;
    dragStartedRef.current = false;
    try {
      const el = dragCaptureElemRef.current as unknown as HTMLElement | null;
      if (el && typeof (el as any).releasePointerCapture === 'function' && pointerIdLocal != null) {
        (el as any).releasePointerCapture(pointerIdLocal);
      }
    } catch (e) {}
    dragCaptureElemRef.current = null;
    setGhostStyle(null);
  };

  const handleWidgetPointerDown = (e: React.PointerEvent, widget: WidgetGridItem) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragInfo({ id: widget.id, width: widget.position.width, height: widget.position.height });
    setDragPointerId(e.pointerId);
    setIsDragBlocked(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragStartedRef.current = false;
    setHoverCell({ col: widget.position.col, row: widget.position.row });
    lastDragCellRef.current = { col: widget.position.col, row: widget.position.row };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragCaptureElemRef.current = e.currentTarget;
    } catch (err) {
      dragCaptureElemRef.current = null;
    }
  };

  useEffect(() => {
    if (!dragInfo || dragPointerId == null) return;

    const process = () => {
      rafRef.current = null;
      const p = lastPointerRef.current;
      if (!p) return;
      const grid = gridRef.current;
      if (!grid) return;

      const start = dragStartRef.current;
      if (start && !dragStartedRef.current) {
        const dx = p.x - start.x;
        const dy = p.y - start.y;
        const distSq = dx * dx + dy * dy;
        const THRESHOLD_PX = 6;
        if (distSq < THRESHOLD_PX * THRESHOLD_PX) return;
        dragStartedRef.current = true;
      }

      const { col, row } = getCellFromPointer(grid, p.x, p.y, { width: dragInfo.width, height: dragInfo.height });
      const last = lastDragCellRef.current;
      if (last && last.col === col && last.row === row) return;
      lastDragCellRef.current = { col, row };
      setHoverCell({ col, row });

      try {
        const metrics = getGridMetrics(grid) as any;
        const { paddingLeft, paddingTop, cellWidth, cellHeight, columnGap, rowGap, customColWidths, customRowHeights } = metrics;
        let left = 0; let widthPx = 0;
        if (customColWidths && customColWidths.length === GRID_COLS) {
          let acc = 0;
          for (let i = 0; i < col; i++) acc += customColWidths[i] + columnGap;
          left = paddingLeft + acc;
          let wacc = 0;
          for (let k = 0; k < dragInfo.width; k++) wacc += customColWidths[col + k] + (k > 0 ? columnGap : 0);
          widthPx = wacc;
        } else {
          const colStride = cellWidth + columnGap;
          left = paddingLeft + col * colStride;
          widthPx = cellWidth * dragInfo.width + columnGap * (dragInfo.width - 1);
        }

        let top = 0;
        let heightPx = 0;
        if (customRowHeights && customRowHeights.length === GRID_ROWS) {
          let acc = 0;
          for (let r = 0; r < row; r++) acc += customRowHeights[r] + rowGap;
          top = paddingTop + acc;
          for (let k = 0; k < dragInfo.height; k++) {
            heightPx += customRowHeights[row + k] + (k > 0 ? rowGap : 0);
          }
        } else {
          const rowStride = cellHeight + rowGap;
          top = paddingTop + row * rowStride;
          heightPx = cellHeight * dragInfo.height + rowGap * (dragInfo.height - 1);
        }

        const widgetAtCell = widgets.find(w => {
          if (w.id === dragInfo.id) return false;
          const pc = w.position;
          return col >= pc.col && col < pc.col + pc.width && row >= pc.row && row < pc.row + pc.height;
        });

        if (widgetAtCell) {
          setSwapCandidateId(widgetAtCell.id);
          const targetPos = widgetAtCell.position;
          let leftT = 0; let widthTPx = 0;
          if (customColWidths && customColWidths.length === GRID_COLS) {
            let accT = 0; for (let i = 0; i < targetPos.col; i++) accT += customColWidths[i] + columnGap;
            leftT = paddingLeft + accT;
            for (let k = 0; k < targetPos.width; k++) widthTPx += customColWidths[targetPos.col + k] + (k > 0 ? columnGap : 0);
          } else {
            leftT = paddingLeft + targetPos.col * (cellWidth + columnGap);
            widthTPx = cellWidth * targetPos.width + columnGap * (targetPos.width - 1);
          }

          let topT = 0;
          let heightTPx = 0;
          if (customRowHeights && customRowHeights.length === GRID_ROWS) {
            let accT = 0;
            for (let r = 0; r < targetPos.row; r++) accT += customRowHeights[r] + rowGap;
            topT = paddingTop + accT;
            for (let k = 0; k < targetPos.height; k++) {
              heightTPx += customRowHeights[targetPos.row + k] + (k > 0 ? rowGap : 0);
            }
          } else {
            topT = paddingTop + targetPos.row * (cellHeight + rowGap);
            heightTPx = cellHeight * targetPos.height + rowGap * (targetPos.height - 1);
          }

          setGhostStyle({ position: 'absolute', left: `${leftT}px`, top: `${topT}px`, width: `${Math.max(0, widthTPx)}px`, height: `${Math.max(0, heightTPx)}px`, pointerEvents: 'none', transform: 'translate(0,0) scale(1.02)', transition: 'transform 120ms ease, left 120ms ease, top 120ms ease', zIndex: 999, opacity: 0.96 });
        } else {
          setSwapCandidateId(null);
          setGhostStyle({ position: 'absolute', left: `${left}px`, top: `${top}px`, width: `${Math.max(0, widthPx)}px`, height: `${Math.max(0, heightPx)}px`, pointerEvents: 'none', transform: 'translate(0,0) scale(1)', transition: 'transform 120ms ease, left 120ms ease, top 120ms ease', zIndex: 999, opacity: 0.95 });
        }
      } catch (err) {}

      const ok = attemptWidgetMove(dragInfo, col, row);
      setIsDragBlocked(!ok);
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(process);
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== dragPointerId) return;
      if (!dragStartedRef.current) { endDrag(); return; }
      if (swapCandidateId && dragInfo) {
        const moving = widgets.find(w => w.id === dragInfo.id);
        const target = widgets.find(w => w.id === swapCandidateId);
        if (moving && target) {
          updateWidgetPosition(moving.id, target.position);
          updateWidgetPosition(target.id, moving.position);
        }
      }
      setSwapCandidateId(null);
      endDrag();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [dragInfo, dragPointerId, updateWidgetPositionWithPush, updateWidgetPosition, widgets, getGridMetrics, getCellFromPointer]);

  return {
    dragInfo,
    dragPointerId,
    isDragBlocked,
    ghostStyle,
    swapCandidateId,
    hoverCell,
    handleWidgetPointerDown,
    endDrag,
    setGhostStyle,
  };
}
