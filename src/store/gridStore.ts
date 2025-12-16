import { create } from 'zustand';

export const GRID_COLS = 6;
export const GRID_ROWS = 6;

export interface GridPosition {
  col: number; // 0-5 (6 columns)
  row: number; // 0-5 (6 rows)
  width: number; // span in columns (1-6)
  height: number; // span in rows (1-6)
}

export interface WidgetGridItem {
  id: string;
  widgetType: string;
  position: GridPosition;
}

interface GridState {
  widgets: WidgetGridItem[];
  addWidget: (widgetType: string, position: GridPosition) => void;
  updateWidgetPosition: (id: string, position: GridPosition) => void;
  updateWidgetPositionWithPush: (id: string, position: GridPosition) => boolean;
  removeWidget: (id: string) => void;
  isPositionOccupied: (position: GridPosition, excludeId?: string) => boolean;
}

const rectanglesOverlap = (a: GridPosition, b: GridPosition) => {
  return !(
    a.col >= b.col + b.width ||
    a.col + a.width <= b.col ||
    a.row >= b.row + b.height ||
    a.row + a.height <= b.row
  );
};

const isWithinBounds = (position: GridPosition) => {
  return (
    position.width >= 1 &&
    position.height >= 1 &&
    position.col >= 0 &&
    position.row >= 0 &&
    position.col + position.width <= GRID_COLS &&
    position.row + position.height <= GRID_ROWS
  );
};

const overlapsAny = (placed: GridPosition[], candidate: GridPosition) => {
  return placed.some(p => rectanglesOverlap(p, candidate));
};

const findNextFreePosition = (
  placed: GridPosition[],
  size: { width: number; height: number },
  startFrom: { col: number; row: number }
): GridPosition | null => {
  const totalCells = GRID_COLS * GRID_ROWS;
  const startCol = Math.min(Math.max(startFrom.col, 0), GRID_COLS - 1);
  const startRow = Math.min(Math.max(startFrom.row, 0), GRID_ROWS - 1);
  const startIndex = startRow * GRID_COLS + startCol;

  const tryIndex = (index: number) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    const candidate: GridPosition = { col, row, width: size.width, height: size.height };
    if (!isWithinBounds(candidate)) return null;
    if (overlapsAny(placed, candidate)) return null;
    return candidate;
  };

  for (let index = startIndex; index < totalCells; index++) {
    const candidate = tryIndex(index);
    if (candidate) return candidate;
  }

  for (let index = 0; index < startIndex; index++) {
    const candidate = tryIndex(index);
    if (candidate) return candidate;
  }

  return null;
};

export const computePushedLayout = (
  widgets: WidgetGridItem[],
  movingId: string,
  desiredPosition: GridPosition
): WidgetGridItem[] | null => {
  const movingWidget = widgets.find(w => w.id === movingId);
  if (!movingWidget) return null;
  if (!isWithinBounds(desiredPosition)) return null;

  const placed: GridPosition[] = [];
  const positionsById = new Map<string, GridPosition>();

  placed.push(desiredPosition);
  positionsById.set(movingId, desiredPosition);

  for (const widget of widgets) {
    if (widget.id === movingId) continue;

    const preferred = widget.position;
    if (isWithinBounds(preferred) && !overlapsAny(placed, preferred)) {
      placed.push(preferred);
      positionsById.set(widget.id, preferred);
      continue;
    }

    const next = findNextFreePosition(
      placed,
      { width: preferred.width, height: preferred.height },
      { col: preferred.col, row: preferred.row }
    );

    if (!next) return null;
    placed.push(next);
    positionsById.set(widget.id, next);
  }

  return widgets.map(w => {
    const position = positionsById.get(w.id);
    return position ? { ...w, position } : w;
  });
};

export const useGridStore = create<GridState>((set, get) => ({
  widgets: [
    {
      id: 'clock-1',
      widgetType: 'clock',
      position: { col: 0, row: 0, width: 1, height: 1 }
    },
    {
      id: 'cpu-temp-1',
      widgetType: 'cpu-temp',
      position: { col: 1, row: 0, width: 1, height: 1 }
    },
    {
      id: 'gpu-temp-1',
      widgetType: 'gpu-temp',
      position: { col: 2, row: 0, width: 1, height: 1 }
    }
  ],

  addWidget: (widgetType, position) => {
    const id = `${widgetType}-${Date.now()}`;
    set(state => ({
      widgets: [...state.widgets, { id, widgetType, position }]
    }));
  },

  updateWidgetPosition: (id, position) => {
    set(state => ({
      widgets: state.widgets.map(w => 
        w.id === id ? { ...w, position } : w
      )
    }));
  },

  updateWidgetPositionWithPush: (id, position) => {
    const next = computePushedLayout(get().widgets, id, position);
    if (!next) return false;
    set({ widgets: next });
    return true;
  },

  removeWidget: (id) => {
    set(state => ({
      widgets: state.widgets.filter(w => w.id !== id)
    }));
  },

  isPositionOccupied: (position, excludeId) => {
    const widgets = get().widgets.filter(w => w.id !== excludeId);
    
    return widgets.some(widget => {
      const w = widget.position;
      // Check if rectangles overlap
      return rectanglesOverlap(position, w);
    });
  },
}));
