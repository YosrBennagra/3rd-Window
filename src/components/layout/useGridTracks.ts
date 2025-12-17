import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS, type DashboardState } from '../../store/gridStore';
import { clampToRange, computeEqualTracks, generateGridTemplate } from './gridMath';

export interface GridMetrics {
  rect: DOMRect;
  paddingLeft: number;
  paddingTop: number;
  innerWidth: number;
  innerHeight: number;
  columnGap: number;
  rowGap: number;
  cellWidth: number;
  cellHeight: number;
  customColWidths: number[] | null;
  customRowHeights: number[] | null;
}

interface UseGridTracksParams {
  gridRef: React.RefObject<HTMLDivElement | null>;
  gridLayout?: DashboardState['gridLayout'];
  gapSize: number;
  onPersist: (colWidths: number[] | null, rowHeights: number[] | null) => void;
}

export function useGridTracks({ gridRef, gridLayout, gapSize, onPersist }: UseGridTracksParams) {
  const [colWidths, setColWidths] = useState<number[] | null>(null);
  const [rowHeights, setRowHeights] = useState<number[] | null>(null);
  const hasRestoredLayoutRef = useRef(false);

  const getGridMetrics = useCallback((): GridMetrics | null => {
    const gridElement = gridRef.current;
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const style = getComputedStyle(gridElement);

    const paddingLeft = parseFloat(style.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(style.paddingRight || '0') || 0;
    const paddingTop = parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = parseFloat(style.paddingBottom || '0') || 0;

    const columnGap = gapSize;
    const rowGap = gapSize;

    const innerWidth = Math.max(0, rect.width - paddingLeft - paddingRight);
    const innerHeight = Math.max(0, rect.height - paddingTop - paddingBottom);

    const cellWidth = GRID_COLS > 0 ? Math.max(0, (innerWidth - columnGap * (GRID_COLS - 1)) / GRID_COLS) : 0;
    const cellHeight = GRID_ROWS > 0 ? Math.max(0, (innerHeight - rowGap * (GRID_ROWS - 1)) / GRID_ROWS) : 0;

    return {
      rect,
      paddingLeft,
      paddingTop,
      innerWidth,
      innerHeight,
      columnGap,
      rowGap,
      cellWidth,
      cellHeight,
      customColWidths: colWidths,
      customRowHeights: rowHeights,
    };
  }, [gridRef, gapSize, colWidths, rowHeights]);

  const getCellFromPointer = useCallback(
    (_gridElement: HTMLElement, clientX: number, clientY: number, size?: { width: number; height: number }) => {
      const metrics = getGridMetrics();
      if (!metrics) return { col: 0, row: 0 };

      const { rect, paddingLeft, paddingTop, innerWidth, innerHeight, columnGap, rowGap, cellWidth, cellHeight, customColWidths, customRowHeights } =
        metrics;

      if (!rect.width || !rect.height || !cellWidth || !cellHeight) {
        return { col: 0, row: 0 };
      }

      const x = clampToRange(clientX - rect.left - paddingLeft, 0, Math.max(0, innerWidth - 1));
      const y = clampToRange(clientY - rect.top - paddingTop, 0, Math.max(0, innerHeight - 1));

      const rowStride = cellHeight + rowGap;

      const maxCol = size ? Math.max(0, GRID_COLS - size.width) : GRID_COLS - 1;
      const maxRow = size ? Math.max(0, GRID_ROWS - size.height) : GRID_ROWS - 1;

      let col = 0;
      if (customColWidths && customColWidths.length === GRID_COLS) {
        let acc = 0;
        for (let columnIndex = 0; columnIndex < GRID_COLS; columnIndex++) {
          const width = customColWidths[columnIndex] + (columnIndex > 0 ? columnGap : 0);
          if (x < acc + width) {
            col = columnIndex;
            break;
          }
          acc += width;
          col = columnIndex;
        }
        col = clampToRange(col, 0, maxCol);
      } else {
        const colStride = cellWidth + columnGap;
        col = clampToRange(Math.floor(x / colStride), 0, maxCol);
      }

      let row = 0;
      if (customRowHeights && customRowHeights.length === GRID_ROWS) {
        let acc = 0;
        for (let rowIndex = 0; rowIndex < GRID_ROWS; rowIndex++) {
          const height = customRowHeights[rowIndex] + (rowIndex > 0 ? rowGap : 0);
          if (y < acc + height) {
            row = rowIndex;
            break;
          }
          acc += height;
          row = rowIndex;
        }
        row = clampToRange(row, 0, maxRow);
      } else {
        row = clampToRange(Math.floor(y / rowStride), 0, maxRow);
      }

      return { col, row };
    },
    [getGridMetrics],
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const layout = gridLayout ?? { colWidths: null, rowHeights: null };

    if (layout.colWidths && layout.colWidths.length === GRID_COLS && layout.rowHeights && layout.rowHeights.length === GRID_ROWS) {
      setColWidths(layout.colWidths);
      setRowHeights(layout.rowHeights);
      hasRestoredLayoutRef.current = true;
      console.info('[grid] Restored layout from saved state');
      return;
    }

    const metrics = getGridMetrics();
    if (!metrics) return;

    const totalColGaps = metrics.columnGap * (GRID_COLS - 1);
    const availableW = Math.max(0, metrics.innerWidth - totalColGaps);
    setColWidths(computeEqualTracks(availableW, GRID_COLS, 40));

    const totalRowGaps = metrics.rowGap * (GRID_ROWS - 1);
    const availableH = Math.max(0, metrics.innerHeight - totalRowGaps);
    setRowHeights(computeEqualTracks(availableH, GRID_ROWS, 32));
    hasRestoredLayoutRef.current = true;
    console.info('[grid] Computed default layout');
  }, [gridLayout, getGridMetrics, gridRef]);

  useEffect(() => {
    if (!colWidths || !rowHeights || !hasRestoredLayoutRef.current) return;

    const scaleTracks = (tracks: number[] | null, available: number, min: number, count: number) => {
      if (!tracks || tracks.length !== count) return computeEqualTracks(available, count, min);
      const currentTotal = tracks.reduce((acc, value) => acc + value, 0);
      if (currentTotal <= 0) return tracks;
      const ratio = available / currentTotal;
      const scaled = tracks.map((value) => Math.max(min, Math.round(value * ratio)));
      const scaledTotal = scaled.reduce((acc, value) => acc + value, 0);
      const diff = Math.round(available - scaledTotal);
      if (diff !== 0) {
        const last = scaled.length - 1;
        const next = scaled[last] + diff;
        if (next >= min) scaled[last] = next;
      }
      return scaled;
    };

    const onResize = () => {
      const metrics = getGridMetrics();
      if (!metrics) return;

      const totalColGaps = metrics.columnGap * (GRID_COLS - 1);
      const availableW = Math.max(0, metrics.innerWidth - totalColGaps);
      setColWidths((prev) => scaleTracks(prev, availableW, 40, GRID_COLS));

      const totalRowGaps = metrics.rowGap * (GRID_ROWS - 1);
      const availableH = Math.max(0, metrics.innerHeight - totalRowGaps);
      setRowHeights((prev) => scaleTracks(prev, availableH, 32, GRID_ROWS));
    };

    let observer: ResizeObserver | null = null;
    try {
      observer = new ResizeObserver(() => onResize());
      if (gridRef.current) observer.observe(gridRef.current);
    } catch {
      observer = null;
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
    };
  }, [colWidths, rowHeights, getGridMetrics, gridRef]);

  useEffect(() => {
    if (colWidths && rowHeights && hasRestoredLayoutRef.current) {
      onPersist(colWidths, rowHeights);
    }
  }, [colWidths, rowHeights, onPersist]);

  const gridStyle = useMemo(
    () => ({
      position: 'relative' as const,
      gridTemplateColumns: generateGridTemplate(colWidths, GRID_COLS, gapSize),
      gridTemplateRows: generateGridTemplate(rowHeights, GRID_ROWS, gapSize),
    }),
    [colWidths, rowHeights, gapSize],
  );

  return {
    colWidths,
    rowHeights,
    setColWidths,
    setRowHeights,
    getGridMetrics,
    getCellFromPointer,
    gridStyle,
  };
}
