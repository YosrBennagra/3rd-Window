export interface DesktopWidgetConfig {
  widgetId: string;
  widgetType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  monitorIndex?: number;
}

export interface DesktopWidgetInstance extends DesktopWidgetConfig {
  isActive: boolean;
  lastMoved?: Date;
}

export type WidgetType = 
  | 'clock'
  | 'system-monitor'
  | 'weather'
  | 'calendar'
  | 'notes'
  | 'network'
  | 'custom';

export interface WidgetMetadata {
  type: WidgetType;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  title: string;
  icon?: string;
}
