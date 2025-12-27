import { create } from 'zustand';
import type { GridConfig, LayoutOperation, WidgetConstraints, WidgetLayout } from '@domain/models/layout';
import { 
  CLOCK_WIDGET_DEFAULT_SETTINGS, 
  ensureClockWidgetSettings,
  TIMER_WIDGET_DEFAULT_SETTINGS,
  ensureTimerWidgetSettings,
  IMAGE_WIDGET_DEFAULT_SETTINGS,
  ensureImageWidgetSettings,
  VIDEO_WIDGET_DEFAULT_SETTINGS,
  ensureVideoWidgetSettings,
  NOTES_WIDGET_DEFAULT_SETTINGS,
  ensureNotesWidgetSettings,
  QUICKLINKS_WIDGET_DEFAULT_SETTINGS,
  ensureQuickLinksWidgetSettings,
  NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS,
  ensureNetworkMonitorWidgetSettings,
  PDF_WIDGET_DEFAULT_SETTINGS,
  ensurePDFWidgetSettings
} from '../../domain/models/widgets';
import { WIDGET_CONSTRAINTS, getWidgetConstraints } from '../../domain/config/widgetConstraints';

/**
 * Grid Layout Store (Zustand Architecture Best Practice)
 * 
 * This store manages grid and widget layout state ONLY.
 * Follows Zustand principles:
 * - One store per concern (grid layout and widgets)
 * - State is minimal and intentional
 * - Actions are named by intent (addWidget, moveWidget, resizeWidget)
 * - No side effects (no IPC, no persistence)
 * - Uses domain logic for calculations (layout algorithms)
 * 
 * Note: Layout algorithms are in this file but could be extracted to
 * domain layer if they become complex. They are deterministic pure functions.
 */

export const DEFAULT_GRID: GridConfig = { columns: 24, rows: 12 };
export const GRID_COLS = DEFAULT_GRID.columns;
export const GRID_ROWS = DEFAULT_GRID.rows;

type GridBox = { x: number; y: number; width: number; height: number };

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const generateWidgetId = (widgetType: string) => `${widgetType}-${Math.random().toString(36).slice(2, 10)}`;

const getDefaultWidgetSettings = (widgetType: string): Record<string, unknown> | undefined => {
  if (widgetType === 'clock') {
    return { ...CLOCK_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'timer') {
    return { ...TIMER_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'image') {
    return { ...IMAGE_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'video') {
    return { ...VIDEO_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'notes') {
    return { ...NOTES_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'quicklinks') {
    return { ...QUICKLINKS_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'network-monitor') {
    return { ...NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS };
  }
  if (widgetType === 'pdf') {
    return { ...PDF_WIDGET_DEFAULT_SETTINGS };
  }
  return undefined;
};

const clampLayoutToGrid = (widget: WidgetLayout, grid: GridConfig): WidgetLayout => {
  const width = clampValue(widget.width, 1, grid.columns);
  const height = clampValue(widget.height, 1, grid.rows);
  const x = clampValue(widget.x, 0, Math.max(0, grid.columns - width));
  const y = clampValue(widget.y, 0, Math.max(0, grid.rows - height));
  return { ...widget, x, y, width, height };
};

const normalizeWidget = (widget: WidgetLayout, grid: GridConfig = DEFAULT_GRID): WidgetLayout => {
  const nextType = widget.widgetType;
  const defaultSettings = getDefaultWidgetSettings(nextType);
  let settings: Record<string, unknown> | undefined;

  if (nextType === 'clock') {
    settings = ensureClockWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'timer') {
    settings = ensureTimerWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'image') {
    settings = ensureImageWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'video') {
    settings = ensureVideoWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'notes') {
    settings = ensureNotesWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'quicklinks') {
    settings = ensureQuickLinksWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'network-monitor') {
    settings = ensureNetworkMonitorWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (nextType === 'pdf') {
    settings = ensurePDFWidgetSettings(widget.settings) as unknown as Record<string, unknown>;
  } else if (widget.settings) {
    settings = { ...widget.settings };
  } else if (defaultSettings) {
    settings = defaultSettings;
  }

  const normalized: WidgetLayout = {
    ...widget,
    widgetType: nextType,
    locked: widget.locked ?? false,
    settings,
  };

  const constraints = WIDGET_CONSTRAINTS[normalized.widgetType];
  if (constraints) {
    normalized.width = clampValue(
      normalized.width,
      constraints.minWidth,
      Math.min(constraints.maxWidth, grid.columns),
    );
    normalized.height = clampValue(
      normalized.height,
      constraints.minHeight,
      Math.min(constraints.maxHeight, grid.rows),
    );
  }

  return clampLayoutToGrid(normalized, grid);
};

const normalizeWidgets = (widgets: WidgetLayout[], grid: GridConfig = DEFAULT_GRID): WidgetLayout[] =>
  widgets.map((widget) => normalizeWidget(widget, grid));

const DEFAULT_WIDGETS: WidgetLayout[] = [];

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
  const constraints = WIDGET_CONSTRAINTS[widgetType];
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
  // Helper: find widget by id
  const findWidget = (id: string) => widgets.find((w) => w.id === id);

  const handleAdd = () => {
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
      settings:
        operation.layout.settings && operation.widgetType === 'clock'
          ? (ensureClockWidgetSettings(operation.layout.settings) as unknown as Record<string, unknown>)
          : operation.layout.settings ?? getDefaultWidgetSettings(operation.widgetType),
    };
    if (!isWithinBounds(grid, newWidget)) return null;
    if (collides(newWidget)) return null;
    return [...widgets, newWidget];
  };

  const handleMove = () => {
    const widget = findWidget(operation.id);
    if (!widget || widget.locked) return null;
    const x = clampValue(operation.x, 0, Math.max(0, grid.columns - widget.width));
    const y = clampValue(operation.y, 0, Math.max(0, grid.rows - widget.height));
    const moved: WidgetLayout = { ...widget, x, y };
    if (!isWithinBounds(grid, moved)) return null;
    if (collides(moved, widget.id)) return null;
    return widgets.map((w) => (w.id === widget.id ? moved : w));
  };

  const handleResize = () => {
    const widget = findWidget(operation.id);
    if (!widget || widget.locked) return null;
    const size = clampSizeToConstraints(widget.widgetType, { width: operation.width, height: operation.height }, grid);
    const x = typeof operation.x === 'number' ? clampValue(operation.x, 0, Math.max(0, grid.columns - size.width)) : widget.x;
    const y = typeof operation.y === 'number' ? clampValue(operation.y, 0, Math.max(0, grid.rows - size.height)) : widget.y;
    const resized: WidgetLayout = { ...widget, x, y, width: size.width, height: size.height };
    if (!isWithinBounds(grid, resized)) return null;
    if (collides(resized, widget.id)) return null;
    return widgets.map((w) => (w.id === widget.id ? resized : w));
  };

  const handleRemove = () => {
    if (!findWidget(operation.id)) return null;
    return widgets.filter((w) => w.id !== operation.id);
  };

  const handleSetLock = () => {
    if (!findWidget(operation.id)) return null;
    return widgets.map((w) => (w.id === operation.id ? { ...w, locked: operation.locked } : w));
  };

  const handleSetSettings = () => {
    const widget = findWidget(operation.id);
    if (!widget) return null;
    const nextSettings = widget.widgetType === 'clock' ? (ensureClockWidgetSettings(operation.settings) as unknown as Record<string, unknown>) : operation.settings;
    return widgets.map((w) => (w.id === operation.id ? { ...w, settings: nextSettings } : w));
  };

  switch (operation.type) {
    case 'addWidget':
      return handleAdd();
    case 'moveWidget':
      return handleMove();
    case 'resizeWidget':
      return handleResize();
    case 'removeWidget':
      return handleRemove();
    case 'setWidgetLock':
      return handleSetLock();
    case 'setWidgetSettings':
      return handleSetSettings();
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
  resizeWidget: (id: string, size: { width: number; height: number; x?: number; y?: number }) => Promise<boolean>;
  removeWidget: (id: string) => Promise<boolean>;
  setWidgetLock: (id: string, locked: boolean) => Promise<boolean>;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => Promise<boolean>;
  isPositionOccupied: (pos: { x: number; y: number; width: number; height: number }, excludeId?: string) => boolean;
  getConstraints: (widgetType: string) => WidgetConstraints;
  toggleDebugGrid: () => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: DEFAULT_GRID,
  widgets: [],
  debugGrid: false,
  isLoaded: false,

  async loadDashboard() {
    // Legacy load - replaced by loadPersisted
    set({ grid: DEFAULT_GRID, widgets: DEFAULT_WIDGETS, isLoaded: true });
  },
  
  // Persistence methods (new versioned persistence)
  async savePersisted() {
    const { grid, widgets } = get();
    return { grid, widgets };
  },
  
  async loadPersisted(layout: { grid: { columns: number; rows: number }; widgets: WidgetLayout[] }) {
    const normalizedWidgets = normalizeWidgets(layout.widgets, layout.grid);
    set({ 
      grid: layout.grid,
      widgets: normalizedWidgets,
      isLoaded: true 
    });
  },

  async applyOperation(operation) {
    const gridState = get().grid ?? DEFAULT_GRID;
    const localWidgets = tryApplyLocalOperation(operation, gridState, get().widgets);
    if (localWidgets) {
      const normalizedWidgets = normalizeWidgets(localWidgets, gridState);
      set({ widgets: normalizedWidgets, isLoaded: true });
      return true;
    }
    return false;
  },

  async addWidget(widgetType, layout) {
    const grid = get().grid ?? DEFAULT_GRID;
    
    // Use widget-specific defaults or provided size
    const constraints = WIDGET_CONSTRAINTS[widgetType];
    const defaultSize = constraints 
      ? { width: constraints.minWidth, height: constraints.minHeight }
      : { width: 4, height: 4 };
    
    const baseSize = clampSizeToConstraints(
      widgetType,
      { width: layout?.width ?? defaultSize.width, height: layout?.height ?? defaultSize.height },
      grid,
    );

    const slot = findFirstSlot(grid, get().widgets, baseSize);
    if (!slot) {
      console.error('[dashboard] no free slot for widget', widgetType, 'size:', baseSize);
      return false;
    }

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

    return result;
  },

  async moveWidget(id, coords) {
    return get().applyOperation({ type: 'moveWidget', id, x: coords.x, y: coords.y });
  },

  async resizeWidget(id, size) {
    return get().applyOperation({
      type: 'resizeWidget',
      id,
      width: size.width,
      height: size.height,
      ...(typeof size.x === 'number' ? { x: size.x } : {}),
      ...(typeof size.y === 'number' ? { y: size.y } : {}),
    });
  },

  async removeWidget(id) {
    return get().applyOperation({ type: 'removeWidget', id });
  },

  async setWidgetLock(id, locked) {
    return get().applyOperation({ type: 'setWidgetLock', id, locked });
  },

  async updateWidgetSettings(id, settings) {
    const widget = get().widgets.find((w) => w.id === id);
    const normalized =
      widget?.widgetType === 'clock' ? (ensureClockWidgetSettings(settings) as unknown as Record<string, unknown>) : settings;
    return get().applyOperation({ type: 'setWidgetSettings', id, settings: normalized });
  },

  isPositionOccupied(pos, excludeId) {
    return get().widgets.some((widget) => {
      if (excludeId && widget.id === excludeId) return false;
      return rectanglesOverlap(widget, pos);
    });
  },

  getConstraints(widgetType) {
    return getWidgetConstraints(widgetType);
  },

  toggleDebugGrid() {
    set((state) => ({ debugGrid: !state.debugGrid }));
  },
}));
