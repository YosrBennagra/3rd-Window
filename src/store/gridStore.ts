import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { GridConfig, LayoutOperation, LayoutState, WidgetConstraints, WidgetLayout } from '../types/layout';

export const DEFAULT_GRID: GridConfig = { columns: 5, rows: 4 };
export const GRID_COLS = DEFAULT_GRID.columns;
export const GRID_ROWS = DEFAULT_GRID.rows;

type GridBox = { x: number; y: number; width: number; height: number };

const DEFAULT_WIDGETS: WidgetLayout[] = [
  {
    id: 'mail-demo',
    widgetType: 'mail',
    x: 0,
    y: 0,
    width: 3,
    height: 2,
  },
  {
    id: 'clock-demo',
    widgetType: 'clock',
    x: 3,
    y: 0,
    width: 2,
    height: 2,
  },
  {
    id: 'chart-demo',
    widgetType: 'chart',
    x: 0,
    y: 2,
    width: 3,
    height: 2,
  },
];

const DEFAULT_LAYOUT_STATE: LayoutState = {
  grid: DEFAULT_GRID,
  widgets: DEFAULT_WIDGETS,
  version: 1,
};

const constraintsByType: Record<string, WidgetConstraints> = {
  mail: { minWidth: 3, minHeight: 2, maxWidth: 5, maxHeight: 4 },
  clock: { minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  chart: { minWidth: 3, minHeight: 2, maxWidth: 5, maxHeight: 4 },
};

const rectanglesOverlap = (a: GridBox, b: GridBox) => {
  return !(
    a.x >= b.x + b.width ||
    a.x + a.width <= b.x ||
    a.y >= b.y + b.height ||
    a.y + a.height <= b.y
  );
};

const isWithinBounds = (grid: GridConfig, layout: GridBox) => {
  return (
    layout.x >= 0 &&
    layout.y >= 0 &&
    layout.x + layout.width <= grid.columns &&
    layout.y + layout.height <= grid.rows &&
    layout.width >= 1 &&
    layout.height >= 1
  );
};

const clampSizeToConstraints = (
  widgetType: string,
  size: { width: number; height: number },
  grid: GridConfig,
): { width: number; height: number } => {
  const constraints = constraintsByType[widgetType];
  if (!constraints) return size;

  return {
    width: Math.min(Math.max(size.width, constraints.minWidth), Math.min(constraints.maxWidth, grid.columns)),
    height: Math.min(Math.max(size.height, constraints.minHeight), Math.min(constraints.maxHeight, grid.rows)),
  };
};

const findFirstSlot = (
  grid: GridConfig,
  widgets: WidgetLayout[],
  desiredSize: { width: number; height: number },
): GridBox | null => {
  const totalCells = grid.columns * grid.rows;

  const candidateFits = (candidate: GridBox) => {
    if (!isWithinBounds(grid, candidate)) return false;
    return !widgets.some((placed) => rectanglesOverlap(placed, candidate));
  };

  for (let index = 0; index < totalCells; index++) {
    const x = index % grid.columns;
    const y = Math.floor(index / grid.columns);
    const candidate = { x, y, width: desiredSize.width, height: desiredSize.height };
    if (candidateFits(candidate)) return candidate;
  }

  return null;
};

interface GridState {
  grid: GridConfig;
  widgets: WidgetLayout[];
  debugGrid: boolean;
  isLoaded: boolean;
  loadDashboard: () => Promise<void>;
  applyOperation: (operation: LayoutOperation) => Promise<boolean>;
  addWidget: (widgetType: string, layout?: Partial<WidgetLayout>) => Promise<boolean>;
  moveWidget: (id: string, coords: { x: number; y: number }) => Promise<boolean>;
  resizeWidget: (id: string, size: { width: number; height: number }) => Promise<boolean>;
  removeWidget: (id: string) => Promise<boolean>;
  isPositionOccupied: (pos: { x: number; y: number; width: number; height: number }, excludeId?: string) => boolean;
  getConstraints: (widgetType: string) => WidgetConstraints | undefined;
  toggleDebugGrid: () => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: DEFAULT_GRID,
  widgets: DEFAULT_WIDGETS,
  debugGrid: false,
  isLoaded: false,

  async loadDashboard() {
    try {
      const state = await invoke<LayoutState>('load_dashboard');
      set({
        grid: state?.grid ?? DEFAULT_GRID,
        widgets: state?.widgets ?? DEFAULT_WIDGETS,
        isLoaded: true,
      });
    } catch (error) {
      console.error('[dashboard] load fallback to defaults', error);
      set({ grid: DEFAULT_GRID, widgets: DEFAULT_WIDGETS, isLoaded: true });
      try {
        await invoke('save_dashboard', { dashboard: DEFAULT_LAYOUT_STATE });
      } catch (persistError) {
        console.warn('[dashboard] failed to persist default layout', persistError);
      }
    }
  },

  async applyOperation(operation) {
    try {
      const state = await invoke<LayoutState>('apply_layout_operation', { operation });
      set({ grid: state.grid ?? get().grid, widgets: state.widgets, isLoaded: true });
      return true;
    } catch (error) {
      console.error('[dashboard] failed to apply layout operation', error);
      return false;
    }
  },

  async addWidget(widgetType, layout) {
    const grid = get().grid ?? DEFAULT_GRID;
    const baseSize = clampSizeToConstraints(
      widgetType,
      { width: layout?.width ?? 2, height: layout?.height ?? 2 },
      grid,
    );

    const slot = findFirstSlot(grid, get().widgets, baseSize);
    if (!slot) {
      console.warn('[dashboard] no free slot for widget', widgetType);
      return false;
    }

    return get().applyOperation({
      type: 'addWidget',
      widgetType,
      layout: {
        id: layout?.id,
        x: layout?.x ?? slot.x,
        y: layout?.y ?? slot.y,
        width: slot.width,
        height: slot.height,
      },
    });
  },

  async moveWidget(id, coords) {
    return get().applyOperation({ type: 'moveWidget', id, x: coords.x, y: coords.y });
  },

  async resizeWidget(id, size) {
    return get().applyOperation({ type: 'resizeWidget', id, width: size.width, height: size.height });
  },

  async removeWidget(id) {
    return get().applyOperation({ type: 'removeWidget', id });
  },

  isPositionOccupied(pos, excludeId) {
    return get().widgets.some((widget) => {
      if (excludeId && widget.id === excludeId) return false;
      return rectanglesOverlap(widget, pos);
    });
  },

  getConstraints(widgetType) {
    return constraintsByType[widgetType];
  },

  toggleDebugGrid() {
    set((state) => ({ debugGrid: !state.debugGrid }));
  },
}));
