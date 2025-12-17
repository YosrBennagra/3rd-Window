export interface GridConfig {
  columns: number;
  rows: number;
}

export interface WidgetLayout {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutState {
  grid: GridConfig;
  widgets: WidgetLayout[];
  version: number;
}

export interface WidgetConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export type LayoutOperation =
  | {
      type: 'addWidget';
      widgetType: string;
      layout: {
        id?: string;
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | { type: 'moveWidget'; id: string; x: number; y: number }
  | { type: 'resizeWidget'; id: string; width: number; height: number }
  | { type: 'removeWidget'; id: string };
