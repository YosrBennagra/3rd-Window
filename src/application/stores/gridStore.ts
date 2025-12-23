import { create } from 'zustand';
import type { GridConfig, LayoutOperation, WidgetConstraints, WidgetLayout } from '../../domain/models/layout';
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

export const DEFAULT_GRID: GridConfig = { columns: 24, rows: 12 };
export const GRID_COLS = DEFAULT_GRID.columns;
export const GRID_ROWS = DEFAULT_GRID.rows;

type GridBox = { x: number; y: number; width: number; height: number };

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const generateWidgetId = (widgetType: string) => `${widgetType}-${Math.random().toString(36).slice(2, 10)}`;

const CLOCK_MIN_WIDTH = 3;
const CLOCK_MIN_HEIGHT = 2;
const CLOCK_MAX_WIDTH = 3;
const CLOCK_MAX_HEIGHT = 2;
const TIMER_MIN_WIDTH = 3;
const TIMER_MIN_HEIGHT = 2;
const TIMER_MAX_WIDTH = 3;
const TIMER_MAX_HEIGHT = 2;
const ACTIVITY_MIN_WIDTH = 6;
const ACTIVITY_MIN_HEIGHT = 4;
const ACTIVITY_MAX_WIDTH = 6;
const ACTIVITY_MAX_HEIGHT = 4;
const IMAGE_MIN_WIDTH = 3;
const IMAGE_MIN_HEIGHT = 3;
const IMAGE_MAX_WIDTH = 12;
const IMAGE_MAX_HEIGHT = 12;
const VIDEO_MIN_WIDTH = 3;
const VIDEO_MIN_HEIGHT = 3;
const VIDEO_MAX_WIDTH = 12;
const VIDEO_MAX_HEIGHT = 12;
const NOTES_MIN_WIDTH = 3;
const NOTES_MIN_HEIGHT = 3;
const NOTES_MAX_WIDTH = 8;
const NOTES_MAX_HEIGHT = 10;
const QUICKLINKS_MIN_WIDTH = 3;
const QUICKLINKS_MIN_HEIGHT = 3;
const QUICKLINKS_MAX_WIDTH = 6;
const QUICKLINKS_MAX_HEIGHT = 8;
const NETWORK_MONITOR_MIN_WIDTH = 3;
const NETWORK_MONITOR_MIN_HEIGHT = 4;
const NETWORK_MONITOR_MAX_WIDTH = 6;
const NETWORK_MONITOR_MAX_HEIGHT = 8;
const TEMPERATURE_MIN_WIDTH = 3;
const TEMPERATURE_MIN_HEIGHT = 3;
const TEMPERATURE_MAX_WIDTH = 4;
const TEMPERATURE_MAX_HEIGHT = 6;
const RAM_MIN_WIDTH = 3;
const RAM_MIN_HEIGHT = 3;
const RAM_MAX_WIDTH = 4;
const RAM_MAX_HEIGHT = 6;
const DISK_MIN_WIDTH = 3;
const DISK_MIN_HEIGHT = 3;
const DISK_MAX_WIDTH = 4;
const DISK_MAX_HEIGHT = 6;
const PDF_MIN_WIDTH = 4;
const PDF_MIN_HEIGHT = 4;
const PDF_MAX_WIDTH = 12;
const PDF_MAX_HEIGHT = 12;
const WIDGET_CONSTRAINTS: Record<string, WidgetConstraints> = {
  clock: { minWidth: CLOCK_MIN_WIDTH, minHeight: CLOCK_MIN_HEIGHT, maxWidth: CLOCK_MAX_WIDTH, maxHeight: CLOCK_MAX_HEIGHT },
  timer: { minWidth: TIMER_MIN_WIDTH, minHeight: TIMER_MIN_HEIGHT, maxWidth: TIMER_MAX_WIDTH, maxHeight: TIMER_MAX_HEIGHT },
  activity: { minWidth: ACTIVITY_MIN_WIDTH, minHeight: ACTIVITY_MIN_HEIGHT, maxWidth: ACTIVITY_MAX_WIDTH, maxHeight: ACTIVITY_MAX_HEIGHT },
  image: { minWidth: IMAGE_MIN_WIDTH, minHeight: IMAGE_MIN_HEIGHT, maxWidth: IMAGE_MAX_WIDTH, maxHeight: IMAGE_MAX_HEIGHT },
  video: { minWidth: VIDEO_MIN_WIDTH, minHeight: VIDEO_MIN_HEIGHT, maxWidth: VIDEO_MAX_WIDTH, maxHeight: VIDEO_MAX_HEIGHT },
  notes: { minWidth: NOTES_MIN_WIDTH, minHeight: NOTES_MIN_HEIGHT, maxWidth: NOTES_MAX_WIDTH, maxHeight: NOTES_MAX_HEIGHT },
  quicklinks: { minWidth: QUICKLINKS_MIN_WIDTH, minHeight: QUICKLINKS_MIN_HEIGHT, maxWidth: QUICKLINKS_MAX_WIDTH, maxHeight: QUICKLINKS_MAX_HEIGHT },
  'network-monitor': { minWidth: NETWORK_MONITOR_MIN_WIDTH, minHeight: NETWORK_MONITOR_MIN_HEIGHT, maxWidth: NETWORK_MONITOR_MAX_WIDTH, maxHeight: NETWORK_MONITOR_MAX_HEIGHT },
  temperature: { minWidth: TEMPERATURE_MIN_WIDTH, minHeight: TEMPERATURE_MIN_HEIGHT, maxWidth: TEMPERATURE_MAX_WIDTH, maxHeight: TEMPERATURE_MAX_HEIGHT },
  ram: { minWidth: RAM_MIN_WIDTH, minHeight: RAM_MIN_HEIGHT, maxWidth: RAM_MAX_WIDTH, maxHeight: RAM_MAX_HEIGHT },
  disk: { minWidth: DISK_MIN_WIDTH, minHeight: DISK_MIN_HEIGHT, maxWidth: DISK_MAX_WIDTH, maxHeight: DISK_MAX_HEIGHT },
  pdf: { minWidth: PDF_MIN_WIDTH, minHeight: PDF_MIN_HEIGHT, maxWidth: PDF_MAX_WIDTH, maxHeight: PDF_MAX_HEIGHT },
};

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
        settings:
          operation.layout.settings && operation.widgetType === 'clock'
            ? (ensureClockWidgetSettings(operation.layout.settings) as unknown as Record<string, unknown>)
            : operation.layout.settings ?? getDefaultWidgetSettings(operation.widgetType),
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
      const x =
        typeof operation.x === 'number'
          ? clampValue(operation.x, 0, Math.max(0, grid.columns - size.width))
          : widget.x;
      const y =
        typeof operation.y === 'number'
          ? clampValue(operation.y, 0, Math.max(0, grid.rows - size.height))
          : widget.y;
      const resized: WidgetLayout = { ...widget, x, y, width: size.width, height: size.height };
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
    case 'setWidgetSettings': {
      const widget = widgets.find((w) => w.id === operation.id);
      if (!widget) return null;
      const nextSettings =
        widget.widgetType === 'clock'
          ? (ensureClockWidgetSettings(operation.settings) as unknown as Record<string, unknown>)
          : operation.settings;
      return widgets.map((w) => (w.id === operation.id ? { ...w, settings: nextSettings } : w));
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
  resizeWidget: (id: string, size: { width: number; height: number; x?: number; y?: number }) => Promise<boolean>;
  removeWidget: (id: string) => Promise<boolean>;
  setWidgetLock: (id: string, locked: boolean) => Promise<boolean>;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => Promise<boolean>;
  isPositionOccupied: (pos: { x: number; y: number; width: number; height: number }, excludeId?: string) => boolean;
  getConstraints: (widgetType: string) => WidgetConstraints | undefined;
  toggleDebugGrid: () => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: DEFAULT_GRID,
  widgets: [],
  debugGrid: false,
  isLoaded: false,

  async loadDashboard() {
    set({ grid: DEFAULT_GRID, widgets: DEFAULT_WIDGETS, isLoaded: true });
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
    return WIDGET_CONSTRAINTS[widgetType];
  },

  toggleDebugGrid() {
    set((state) => ({ debugGrid: !state.debugGrid }));
  },
}));
