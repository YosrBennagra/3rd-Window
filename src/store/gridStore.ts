import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

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

// Persisted dashboard state
export interface DashboardState {
  widgets: WidgetGridItem[];
  gridLayout?: {
    colWidths?: number[] | null;
    rowHeights?: number[] | null;
  };
  version: number; // For migration support
}

interface GridState {
  widgets: WidgetGridItem[];
  gridLayout: {
    colWidths: number[] | null;
    rowHeights: number[] | null;
  };
  addWidget: (widgetType: string, position: GridPosition) => void;
  updateWidgetPosition: (id: string, position: GridPosition) => void;
  updateWidgetPositionWithPush: (id: string, position: GridPosition) => boolean;
  removeWidget: (id: string) => void;
  isPositionOccupied: (position: GridPosition, excludeId?: string) => boolean;
  setGridLayout: (colWidths: number[] | null, rowHeights: number[] | null) => void;
  loadDashboard: () => Promise<void>;
  saveDashboard: () => Promise<void>;
  _persistTimer: number | null;
}

// Default dashboard state
const defaultDashboard: DashboardState = {
  widgets: [
    {
      id: 'clock-1',
      widgetType: 'clock',
      position: { col: 0, row: 0, width: 1, height: 1 }
    },
  ],
  gridLayout: {
    colWidths: null,
    rowHeights: null,
  },
  version: 1,
};

// Debounce delay for auto-save (ms)
const SAVE_DEBOUNCE_MS = 500;

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

// Debounced auto-save helper
const scheduleSave = (store: GridState) => {
  if (store._persistTimer) {
    clearTimeout(store._persistTimer);
  }
  store._persistTimer = setTimeout(() => {
    store._persistTimer = null;
    void store.saveDashboard();
  }, SAVE_DEBOUNCE_MS);
};

export const useGridStore = create<GridState>((set, get) => ({
  widgets: defaultDashboard.widgets,
  gridLayout: {
    colWidths: null,
    rowHeights: null,
  },
  _persistTimer: null,

  addWidget: (widgetType, position) => {
    const id = `${widgetType}-${Date.now()}`;
    set(state => ({
      widgets: [...state.widgets, { id, widgetType, position }]
    }));
    scheduleSave(get());
  },

  updateWidgetPosition: (id, position) => {
    set(state => ({
      widgets: state.widgets.map(w => 
        w.id === id ? { ...w, position } : w
      )
    }));
    scheduleSave(get());
  },

  updateWidgetPositionWithPush: (id, position) => {
    const next = computePushedLayout(get().widgets, id, position);
    if (!next) return false;
    set({ widgets: next });
    scheduleSave(get());
    return true;
  },

  removeWidget: (id) => {
    set(state => ({
      widgets: state.widgets.filter(w => w.id !== id)
    }));
    scheduleSave(get());
  },

  setGridLayout: (colWidths, rowHeights) => {
    console.info('[grid] setGridLayout ->', { colWidths, rowHeights });
    set({ gridLayout: { colWidths, rowHeights } });
    scheduleSave(get());
  },

  isPositionOccupied: (position, excludeId) => {
    const widgets = get().widgets.filter(w => w.id !== excludeId);
    
    return widgets.some(widget => {
      const w = widget.position;
      return rectanglesOverlap(position, w);
    });
  },

  loadDashboard: async () => {
    try {
      const dashboard = await invoke<DashboardState>('load_dashboard');
      console.info('[dashboard] loadDashboard ->', dashboard);
      
      // Validate and restore state
      const validatedWidgets = dashboard.widgets.filter(w => 
        isWithinBounds(w.position)
      );
      
      set({ 
        widgets: validatedWidgets.length > 0 ? validatedWidgets : defaultDashboard.widgets,
        gridLayout: {
          colWidths: dashboard.gridLayout?.colWidths ?? null,
          rowHeights: dashboard.gridLayout?.rowHeights ?? null,
        },
      });
      
      console.info('[dashboard] loadDashboard -> success');
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Graceful fallback to defaults
      set({ 
        widgets: defaultDashboard.widgets,
        gridLayout: { colWidths: null, rowHeights: null },
      });
    }
  },

  saveDashboard: async () => {
    try {
      const state = get();
      const dashboard: DashboardState = {
        widgets: state.widgets,
        gridLayout: state.gridLayout,
        version: 1,
      };
      
      await invoke('save_dashboard', { dashboard });
      console.info('[dashboard] saveDashboard -> success');
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  },
}));
