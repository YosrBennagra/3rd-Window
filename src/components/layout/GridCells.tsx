import React from 'react';
import { GRID_COLS, GRID_ROWS } from '../../store/gridStore';

type Cell = { col: number; row: number } | null;

interface Props {
  hoverCell?: Cell;
  dragInfo?: any;
  isDragBlocked?: boolean;
  isOutOfBounds: (pos: { col: number; row: number; width: number; height: number }) => boolean;
}

export default function GridCells({ hoverCell, dragInfo, isDragBlocked, isOutOfBounds }: Props) {
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // No hover/invalid states - pure live reflow
      cells.push(
        <div
          key={`${col}-${row}`}
          className="grid-cell"
          style={{
            gridColumn: col * 2 + 1,
            gridRow: row * 2 + 1,
          }}
        />
      );
    }
  }
  return <>{cells}</>;
}
