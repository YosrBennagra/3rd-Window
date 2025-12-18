import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { GridConfig, LayoutOperation, LayoutState, WidgetConstraints, WidgetLayout } from '../types/layout';

export const DEFAULT_GRID: GridConfig = { columns: 24, rows: 12 };
export const GRID_COLS = DEFAULT_GRID.columns;
export const GRID_ROWS = DEFAULT_GRID.rows;

type GridBox = { x: number; y: number; width: number; height: number };

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const generateWidgetId = (widgetType: string) => `${widgetType}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeWidget = (widget: WidgetLayout): WidgetLayout => {
  const nextType = widget.widgetType === 'mail' ? 'notifications' : widget.widgetType;
  return {
    ...widget,
    widgetType: nextType,
    locked: widget.locked ?? false,
  };
};

const normalizeWidgets = (widgets: WidgetLayout[]): WidgetLayout[] => widgets.map(normalizeWidget);

const DEFAULT_WIDGETS: WidgetLayout[] = [
  {
    id: 'notifications-demo',
    widgetType: 'notifications',
    x: 0,
    y: 0,
    width: 6,
    height: 4,
    locked: false,
  },
  {
    id: 'clock-demo',
    widgetType: 'clock',
    x: 20,
    y: 0,
    width: 4,
    height: 2,
    locked: false,
  },
  {
    id: 'chart-demo',
    widgetType: 'chart',
    x: 0,
    y: 8,
    width: 6,
    height: 4,
    locked: false,
  },
];

const DEFAULT_LAYOUT_STATE: LayoutState = {
  grid: DEFAULT_GRID,
  widgets: DEFAULT_WIDGETS,
  version: 1,
};

const constraintsByType: Record<string, WidgetConstraints> = {
  notifications: { minWidth: 6, minHeight: 4, maxWidth: 24, maxHeight: 12 },
  clock: { minWidth: 4, minHeight: 2, maxWidth: 12, maxHeight: 8 },
  chart: { minWidth: 6, minHeight: 4, maxWidth: 24, maxHeight: 12 },
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

const tryApplyLocalOperation = (
  operation: LayoutOperation,
  grid: GridConfig,
  widgets: WidgetLayout[],
): WidgetLayout[] | null => {
  const collides = (candidate: WidgetLayout, excludeId?: string) =>
    widgets.some((existing) => {
      if (excludeId && existing.id === excludeId) return false;
      if (existing.id === candidate.id) return false;
      return rectanglesOverlap(existing, candidate);
    });

  switch (operation.type) {
    case 'addWidget': {
      const size = clampSizeToConstraints(
        operation.widgetType,
        { width: operation.layout.width, height: operation.layout.height },
        grid,
      );
      const x = clampValue(operation.layout.x, 0, Math.max(0, grid.columns - size.width));
      const y = clampValue(operation.layout.y, 0, Math.max(0, grid.rows - size.height));
      const newWidget: WidgetLayout = {
        id: operation.layout.id ?? generateWidgetId(operation.widgetType),
        widgetType: operation.widgetType,
        x,
        y,
        width: size.width,
        height: size.height,
        locked: operation.layout.locked ?? false,
      };
      if (!isWithinBounds(grid, newWidget)) return null;
      if (collides(newWidget)) return null;
      return [...widgets, newWidget];
    }
    case 'moveWidget': {
      const widget = widgets.find((w) => w.id === operation.id);
      if (!widget) return null;
      if (widget.locked) return null;
      const x = clampValue(operation.x, 0, Math.max(0, grid.columns - widget.width));
      const y = clampValue(operation.y, 0, Math.max(0, grid.rows - widget.height));
      const moved: WidgetLayout = { ...widget, x, y };
      if (!isWithinBounds(grid, moved)) return null;
      if (collides(moved, widget.id)) return null;
      return widgets.map((w) => (w.id === widget.id ? moved : w));
    }
    case 'resizeWidget': {
      const widget = widgets.find((w) => w.id === operation.id);
      if (!widget) return null;
      if (widget.locked) return null;
      const size = clampSizeToConstraints(widget.widgetType, { width: operation.width, height: operation.height }, grid);
      const resized: WidgetLayout = { ...widget, width: size.width, height: size.height };
      if (!isWithinBounds(grid, resized)) return null;
      if (collides(resized, widget.id)) return null;
      return widgets.map((w) => (w.id === widget.id ? resized : w));
    }
    case 'removeWidget': {
      if (!widgets.find((w) => w.id === operation.id)) return null;
      return widgets.filter((w) => w.id !== operation.id);
    }
    case 'setWidgetLock': {
      const widget = widgets.find((w) => w.id === operation.id);
      if (!widget) return null;
      return widgets.map((w) => (w.id === operation.id ? { ...w, locked: operation.locked } : w));
    }
    default:
      return null;
  }
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
  setWidgetLock: (id: string, locked: boolean) => Promise<boolean>;
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
      
      // Migrate old grids to 24×12
      if (state?.grid && ((state.grid.columns === 5 && state.grid.rows === 4) || (state.grid.columns === 12 && state.grid.rows === 24))) {
        console.log(`[dashboard] migrating ${state.grid.columns}×${state.grid.rows} layout to 24×12`);
        const scaleX = state.grid.columns === 5 ? 4.8 : 2;
        const scaleY = state.grid.rows === 4 ? 3 : 0.5;
        const migratedState = {
          ...state,
          grid: DEFAULT_GRID,
          widgets: state.widgets.map(w => ({
            ...w,
            x: Math.round(w.x * scaleX),
            y: Math.round(w.y * scaleY),
            width: Math.round(w.width * scaleX),
            height: Math.round(w.height * scaleY),
          })),
        };
        set({
          grid: migratedState.grid,
          widgets: normalizeWidgets(migratedState.widgets),
          isLoaded: true,
        });
        // Save migrated layout
        await invoke('save_dashboard', { dashboard: migratedState });
      } else {
        const nextWidgets = state?.widgets ? normalizeWidgets(state.widgets) : DEFAULT_WIDGETS;
        set({
          grid: state?.grid ?? DEFAULT_GRID,
          widgets: nextWidgets,
          isLoaded: true,
        });
      }
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
      set({ grid: state.grid ?? get().grid, widgets: normalizeWidgets(state.widgets), isLoaded: true });
      return true;
    } catch (error) {
      console.error('[dashboard] failed to apply layout operation', error);
      const localWidgets = tryApplyLocalOperation(operation, get().grid ?? DEFAULT_GRID, get().widgets);
      if (localWidgets) {
        console.warn('[dashboard] applied layout operation locally (persist later)');
        set({ widgets: normalizeWidgets(localWidgets), isLoaded: true });
        return true;
      }
      return false;
    }
  },

  async addWidget(widgetType, layout) {
    const grid = get().grid ?? DEFAULT_GRID;
    
    // Use widget-specific defaults or provided size
    const constraints = constraintsByType[widgetType];
    const defaultSize = constraints 
      ? { width: constraints.minWidth, height: constraints.minHeight }
      : { width: 4, height: 4 };
    
    const baseSize = clampSizeToConstraints(
      widgetType,
      { width: layout?.width ?? defaultSize.width, height: layout?.height ?? defaultSize.height },
      grid,
    );

    console.log('[dashboard] addWidget:', { widgetType, baseSize, grid, widgetCount: get().widgets.length });

    const slot = findFirstSlot(grid, get().widgets, baseSize);
    if (!slot) {
      console.error('[dashboard] no free slot for widget', widgetType, 'size:', baseSize, 'current widgets:', get().widgets);
      return false;
    }

    console.log('[dashboard] found slot:', slot);

    const result = await get().applyOperation({
      type: 'addWidget',
      widgetType,
      layout: {
        id: layout?.id,
        x: layout?.x ?? slot.x,
        y: layout?.y ?? slot.y,
        width: slot.width,
        height: slot.height,
        locked: layout?.locked ?? false,
      },
    });

    console.log('[dashboard] applyOperation result:', result);
    return result;
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

  async setWidgetLock(id, locked) {
    return get().applyOperation({ type: 'setWidgetLock', id, locked });
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
