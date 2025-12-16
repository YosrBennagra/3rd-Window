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
      const isHovered = hoverCell?.col === col && hoverCell?.row === row;
      const isInvalidHover = Boolean(
        isHovered &&
        dragInfo &&
        (isDragBlocked || isOutOfBounds({ col, row, width: dragInfo.width, height: dragInfo.height }))
      );
      cells.push(
        <div
          key={`${col}-${row}`}
          className={`grid-cell ${isHovered ? 'grid-cell--hover' : ''} ${isInvalidHover ? 'grid-cell--invalid' : ''}`}
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
          }}
        />
      );
    }
  }
  return <>{cells}</>;
}
