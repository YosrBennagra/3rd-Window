import type { GridConfig } from '../../types/layout';

interface Props {
  grid: GridConfig;
  highlight?: { x: number; y: number; width: number; height: number } | null;
  debugGrid?: boolean;
  isBlocked?: boolean;
}

export default function GridCells({ grid, highlight, debugGrid, isBlocked }: Props) {
  const cells: React.ReactNode[] = [];

  const isHighlighted = (col: number, row: number) => {
    if (!highlight) return false;
    return col >= highlight.x && col < highlight.x + highlight.width && row >= highlight.y && row < highlight.y + highlight.height;
  };

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.columns; col++) {
      const active = isHighlighted(col, row);
      cells.push(
        <div
          key={`${col}-${row}`}
          className={`grid-cell${debugGrid || active ? ' grid-cell--visible' : ''}${active ? ' grid-cell--active' : ''}${active && isBlocked ? ' grid-cell--blocked' : ''}`}
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
